const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'secret123';

// simple auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// GET products (protected)
router.get('/', authMiddleware, async (req, res) => {
  const products = await Product.find().limit(50).lean();
  res.json({ products });
});

// POST product (protected) - create sample
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, price } = req.body;
  const p = new Product({ title, description, price });
  await p.save();
  res.json({ product: p });
});

module.exports = router;
