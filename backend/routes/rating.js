const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const verifyToken = require('../middlewares/auth');

const router = express.Router();

// POST /api/ratings
// Body: { storeId: number, rating: number }
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { name, address } = req.query;

  const filters = {};
  if (name) filters.name = { contains: name, mode: 'insensitive' };
  if (address) filters.address = { contains: address, mode: 'insensitive' };

  try {
    const stores = await prisma.store.findMany({
      where: filters,
      include: {
        ratings: true,
      },
    });

    const result = stores.map((store) => {
      const userRating = store.ratings.find((r) => r.userId === userId)?.rating ?? null;

      const totalRatings = store.ratings.length;
      const averageRating =
        totalRatings > 0
          ? (
              store.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
            ).toFixed(2)
          : null;

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        userRating,
        totalRatings,
        overallRating: averageRating,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
