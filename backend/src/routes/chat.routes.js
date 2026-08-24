const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/auth.middleware');

function formatMessage(msg) {
  if (!msg) return null;
  return {
    ...msg,
    user_id: msg.userId,
    room_id: msg.roomId,
    created_at: msg.createdAt,
    user: msg.user ? {
      ...msg.user,
      full_name: msg.user.fullName,
    } : null,
  };
}

function formatRoom(room) {
  if (!room) return null;
  return {
    ...room,
    created_at: room.createdAt,
    members: Array.isArray(room.members) ? room.members.map(m => ({
      ...m,
      user_id: m.userId,
      user: m.user ? { ...m.user, full_name: m.user.fullName } : null,
    })) : [],
    messages: Array.isArray(room.messages) ? room.messages.map(formatMessage) : [],
  };
}

// --- Chat & Communication Routes ---

router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.chatRoom.findMany({
      where: {
        members: {
          some: { userId: req.user.id },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map(formatRoom);
    res.json({ rooms: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat rooms', error: error.message });
  }
});

router.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { name, type, memberUserIds } = req.body;
    const allMembers = Array.from(new Set([...(memberUserIds || []), req.user.id]));

    const room = await prisma.chatRoom.create({
      data: {
        name: name || 'General Chat',
        type: type || 'group',
        members: {
          create: allMembers.map((userId) => ({ userId })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    const formatted = formatRoom(room);
    res.status(201).json({ message: 'Chat room created successfully', room: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat room', error: error.message });
  }
});

router.get('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.message.findMany({
      where: { roomId: req.params.roomId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = list.map(formatMessage);
    res.json({ messages: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

router.post('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await prisma.message.create({
      data: {
        roomId: req.params.roomId,
        userId: req.user.id,
        content,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    const formatted = formatMessage(message);
    res.status(201).json({ message: 'Message sent successfully', messageData: formatted, message: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

module.exports = router;
