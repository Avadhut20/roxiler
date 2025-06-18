const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const verifyToken = require('../middlewares/auth');

const router = express.Router();

// GET /api/owner/dashboard
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const ownerId = req.user.id;

    const stores = await prisma.store.findMany({
      where: { ownerId },
      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
              },
            },
          },
        },
      },
    });

    // Collect users and calculate rating average
    const ratingUsers = [];
    let total = 0;
    let count = 0;

    stores.forEach(store => {
      store.ratings.forEach(rating => {
        ratingUsers.push(rating.user);
        total += rating.rating;
        count += 1;
      });
    });

    const averageRating = count > 0 ? (total / count).toFixed(2) : 'No ratings yet';

    res.json({
      totalStores: stores.length,
      averageRating,
      users: ratingUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
