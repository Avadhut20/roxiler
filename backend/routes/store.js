const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const verifyToken = require('../middlewares/auth');
const adminOnly = require('../middlewares/admin');

const router = express.Router();
router.post('/', verifyToken, adminOnly, async (req, res) => {

  try {
    console.log("token", req.user);
    const { name, email, address, ownerId } = req.body;
    console.log(`Creating store with data:`, { name, email, address, ownerId });

    if (!name || !email || !ownerId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingStore = await prisma.store.findUnique({ where: { email } });
    if (existingStore) {
      return res.status(409).json({ message: 'Store with this email already exists' });
    }

    const newStore = await prisma.store.create({
      data: {
        name,
        email,
        address,
        ownerId,
      },
    });

    res.status(201).json(newStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/ratings", verifyToken, async (req, res) => {
  const userId = req.user.id;
  
  console.log(`Fetching ratings for user ${userId}`);
  try {
    const email= await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    console.log(`User email: ${email.email}`);


    const storeId= await prisma.store.findUnique({
      where: { email:email.email },
      select: { id: true },
    });
    console.log(`Store ID for user ${userId}: ${storeId.id}`);
    const ratings = await prisma.rating.findMany({
      where: { storeId: storeId.id},
      include: { store: true },
    });
    console.log(`Ratings found:`, ratings);

    if (ratings.length === 0) {
      return res.status(404).json({ message: 'No ratings found for this user' });
    }

    res.status(200).json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET /api/stores?name=&address=
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { name, address } = req.query;
  console.log(`Fetching stores for user ${userId} with filters:`, { name, address });
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
      const userRating = store.ratings.find((r) => r.userId === userId);
      const avgRating =
        store.ratings.length > 0
          ? (
              store.ratings.reduce((acc, r) => acc + r.rating, 0) /
              store.ratings.length
            ).toFixed(2)
          : 'No ratings yet';

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        averageRating: avgRating,
        userRating: userRating ? userRating.rating : null,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
