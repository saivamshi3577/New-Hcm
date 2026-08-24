const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth.middleware');

const router = express.Router();

// --- Auth Routes ---

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Email, password, and fullName are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: role || 'EMPLOYEE',
        employeeProfile: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        ...user,
        full_name: user.fullName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error signing up user', error: error.message });
  }
});

// Helper to resolve company for any user (admin, employee, etc.)
async function resolveUserCompany(user) {
  if (!user) return null;
  try {
    // 1. Direct admin of company
    let comp = await prisma.company.findFirst({
      where: {
        OR: [
          { adminId: user.id },
          { adminEmail: { equals: user.email, mode: 'insensitive' } },
        ]
      }
    });
    if (comp) return comp;

    // 2. Employee created by admin
    const createdBy = user.employeeProfile?.createdByAdmin;
    if (createdBy) {
      comp = await prisma.company.findFirst({
        where: {
          OR: [
            { adminEmail: { equals: createdBy, mode: 'insensitive' } },
            { adminId: createdBy },
          ]
        }
      });
      if (comp) return comp;
    }

    // 3. Domain matching
    const emailLower = (user.email || '').toLowerCase().trim();
    const domainPart = emailLower.includes('@') ? emailLower.split('@')[1] : null;
    if (domainPart && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domainPart)) {
      comp = await prisma.company.findFirst({
        where: { domain: { equals: domainPart, mode: 'insensitive' } }
      });
      if (comp) return comp;
    }
  } catch (e) {
    console.error('Error resolving user company:', e);
  }
  return null;
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employeeProfile: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    const company = await resolveUserCompany(user);
    const companyLogo = company?.logoUrl || null;

    res.json({
      message: 'Login successful',
      token,
      user: {
        ...userWithoutPassword,
        full_name: userWithoutPassword.fullName,
        company_id: company?.id || null,
        company_name: company?.name || null,
        company_logo: companyLogo,
        company_logo_url: companyLogo,
        logo_url: companyLogo,
        company: company,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        employeeProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const company = await resolveUserCompany(user);
    const companyLogo = company?.logoUrl || null;

    res.json({
      user: {
        ...user,
        full_name: user.fullName,
        company_id: company?.id || null,
        company_name: company?.name || null,
        company_logo: companyLogo,
        company_logo_url: companyLogo,
        logo_url: companyLogo,
        company: company,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

module.exports = router;
