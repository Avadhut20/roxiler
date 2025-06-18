const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const verifyToken = require('../middlewares/auth');

const router = express.Router();

// POST /api/ratings
// Body: { storeId: number, rating: number }
router.post('/', verifyToken, async (req, res) => {
  const { storeId, rating } = req.body;
  const userId = req.user.id;

  if (!storeId || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Invalid storeId or rating (1-5)' });
  }

  try {
    const existingRating = await prisma.rating.findUnique({
      where: { userId_storeId: { userId, storeId } },
    });

    if (existingRating) {
      await prisma.rating.update({
        where: { userId_storeId: { userId, storeId } },
        data: { rating },
      });
    } else {
      await prisma.rating.create({
        data: { userId, storeId, rating },
      });
    }

    const ratings = await prisma.rating.findMany({
      where: { storeId },
      select: { rating: true },
    });

    const totalRatings = ratings.length;
    const totalPoints = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = parseFloat((totalPoints / totalRatings).toFixed(2));

    await prisma.store.update({
      where: { id: storeId },
      data: { overallRating: averageRating, totalRatings: totalRatings },
    });

    res.status(200).json({
      message: 'Rating saved',
      data: {
        averageRating,
        totalRatings,
        userRating: rating,
        storeId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
