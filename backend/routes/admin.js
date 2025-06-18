const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const verifyToken = require('../middlewares/auth');
const adminOnly = require('../middlewares/admin');
const bcrypt = require("bcrypt");
const jwt= require("jsonwebtoken");

const router = express.Router();

// GET /api/admin/dashboard
router.get('/dashboard', verifyToken, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.rating.count(),
    ]);

    res.json({
      totalUsers,
      totalStores,
      totalRatings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post('/create-user', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        role,
      },
    });

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.post('/create-store', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, email, address,password, ownerId } = req.body;

    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== 'OWNER') {
      return res.status(400).json({ message: 'Invalid store owner ID' });
    }

    const store = await prisma.store.create({
      data: {
        name,
        email,
        address,
        password: await bcrypt.hash(password, 10),
        ownerId,
      },
    });

    res.status(201).json({ message: 'Store created', store });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/users', verifyToken, adminOnly, async (req, res) => {
  const { name, email, role, address } = req.query;

  const users = await prisma.user.findMany({
    where: {
      name: name ? { contains: name, mode: 'insensitive' } : undefined,
      email: email ? { contains: email, mode: 'insensitive' } : undefined,
      address: address ? { contains: address, mode: 'insensitive' } : undefined,
      role: role ? role : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
      role: true,
    },
  });

  res.json(users);
});
router.get('/stores', verifyToken, adminOnly, async (req, res) => {
  const { name, email, address } = req.query;

  const stores = await prisma.store.findMany({
    where: {
      name: name ? { contains: name, mode: 'insensitive' } : undefined,
      email: email ? { contains: email, mode: 'insensitive' } : undefined,
      address: address ? { contains: address, mode: 'insensitive' } : undefined,
    },
    include: {
      ratings: true,
    },
  });

  const storeData = stores.map((store) => {
    const averageRating =
      store.ratings.length > 0
        ? (
            store.ratings.reduce((acc, cur) => acc + cur.rating, 0) /
            store.ratings.length
          ).toFixed(2)
        : 'N/A';

    return {
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      rating: averageRating,
    };
  });

  res.json(storeData);
});
router.get('/user/:id', verifyToken, adminOnly, async (req, res) => {
  const userId = parseInt(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ratings: true,
      stores: true,
    },
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  const averageRating =
    user.role === 'OWNER' && user.stores.length > 0
      ? (
          user.stores.flatMap((store) => store.ratings).reduce((sum, r) => sum + r.rating, 0) /
          user.stores.flatMap((store) => store.ratings).length
        ).toFixed(2)
      : undefined;

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    address: user.address,
    role: user.role,
    ...(averageRating && { averageRating }),
  });
});


module.exports = router;
