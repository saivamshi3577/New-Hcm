const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/auth.middleware');



function formatDocument(doc) {
  if (!doc) return null;
  return {
    ...doc,
    user_id: doc.userId,
    file_url: doc.fileUrl,
    document_type: doc.documentType,
    created_at: doc.createdAt,
    user: doc.user ? {
      ...doc.user,
      full_name: doc.user.fullName,
    } : null,
  };
}

// --- Document Management Routes ---

// List documents (scoped by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId, user_id, documentType, document_type } = req.query;
    const targetUserId = userId || user_id;
    const targetDocType = documentType || document_type;
    const userRole = String(req.user?.role || '').toUpperCase();

    let whereClause = {};

    // Admins, HR, Super Admins can see all documents
    if (['SUPER_ADMIN', 'ADMIN', 'HR'].includes(userRole)) {
      whereClause = {
        ...(targetUserId && { userId: targetUserId }),
        ...(targetDocType && { documentType: targetDocType }),
      };
    } else {
      // Employees and Team Leads see only their own
      whereClause = {
        userId: targetUserId || req.user.id,
        ...(targetDocType && { documentType: targetDocType }),
      };
    }

    const list = await prisma.document.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map(formatDocument);
    res.json({ documents: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
});

// Get single document
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const formatted = formatDocument(doc);
    res.json({ document: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document', error: error.message });
  }
});

// Create/Upload document
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, fileUrl, file_url, documentType, document_type, userId, user_id } = req.body;

    if (!title || !(fileUrl || file_url)) {
      return res.status(400).json({ message: 'Title and file URL are required' });
    }

    const targetUserId = userId || user_id || req.user.id;
    const targetDocType = documentType || document_type || 'OTHER';

    const doc = await prisma.document.create({
      data: {
        userId: targetUserId,
        title,
        fileUrl: fileUrl || file_url,
        documentType: targetDocType,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    const formatted = formatDocument(doc);
    res.status(201).json({ message: 'Document uploaded successfully', document: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only allow owner, admin, HR, or super admin to delete
    const userRole = String(req.user?.role || '').toUpperCase();
    if (doc.userId !== req.user.id && !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(userRole)) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
});

module.exports = router;
