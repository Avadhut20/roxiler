const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient(); // import your Prisma client instance
const bcrypt = require('bcryptjs');
const verifyToken = require('../middlewares/auth');      // JWT auth middleware
const adminOnly = require('../middlewares/admin');    // Middleware that allows only ADMIN role

const router = express.Router();

// Hash password helper
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// POST /api/users - Add new user (ADMIN only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address: address || '',
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users - List users with filters (ADMIN only)
router.get('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, email, address, role } = req.query;

    // Build filters dynamically
    const filters = {};
    if (name) filters.name = { contains: name, mode: 'insensitive' };
    if (email) filters.email = { contains: email, mode: 'insensitive' };
    if (address) filters.address = { contains: address, mode: 'insensitive' };
    if (role) filters.role = role.toUpperCase();

    const users = await prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put('/password', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { current, new: newPassword } = req.body;
  console.log(`Updating password for user ID: ${userId}`);

  if (!current || !newPassword) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordCorrect = await bcrypt.compare(current, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
router.put('/update-password', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new passwords are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update failed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/:id - Get user details (ADMIN only)
// If user is OWNER, include their average rating for their stores
router.get('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        stores: {
          select: {
            id: true,
            name: true,
            ratings: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    let ratingSummary = null;
    if (user.role === 'OWNER') {
      // Calculate average rating across all stores owned by this user
      let totalRatings = 0;
      let ratingsCount = 0;

      user.stores.forEach(store => {
        ratingsCount += store.ratings.length;
        totalRatings += store.ratings.reduce((acc, r) => acc + r.rating, 0);
      });

      ratingSummary =
        ratingsCount > 0 ? (totalRatings / ratingsCount).toFixed(2) : 'No ratings yet';
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      averageRating: ratingSummary,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
