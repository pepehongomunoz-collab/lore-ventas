/**
 * RUTAS DE PRODUCTOS - CON PROTECCIÓN DE ROLES
 * 
 * Endpoints para gestionar productos de Natura, Avon y Arbell
 * Solo admin y developer pueden crear/editar/eliminar
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

/**
 * GET /api/products?brand=natura
 * Obtener productos por marca (público)
 */
router.get('/', async (req, res) => {
  try {
    const { brand } = req.query;

    // Filtrar por marca si se proporciona
    const filter = brand ? { brand: brand.toLowerCase() } : {};

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ products, count: products.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/products/search?q=perfume
 * Buscar productos por texto (público)
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    // Validar query mínimo
    if (!q || q.trim().length < 2) {
      return res.json({ products: [], count: 0, message: 'Query too short' });
    }

    const searchQuery = q.trim();

    // Búsqueda con regex para mayor flexibilidad (case-insensitive)
    const products = await Product.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { brand: { $regex: searchQuery, $options: 'i' } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ products, count: products.length, query: searchQuery });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/products/all
 * Obtener todos los productos (solo admin/developer)
 */
router.get('/all', verifyToken, authorize('admin', 'developer'), async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({ products, count: products.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/products
 * Crear producto (solo admin/developer)
 */
router.post('/', verifyToken, authorize('admin', 'developer'), async (req, res) => {
  try {
    const { name, description, price, image, brand, category } = req.body;

    // Validaciones
    if (!name || !price || !image || !brand) {
      return res.status(400).json({
        message: 'Name, price, image, and brand are required'
      });
    }

    if (!['natura', 'avon', 'arbell'].includes(brand.toLowerCase())) {
      return res.status(400).json({
        message: 'Brand must be natura, avon, or arbell'
      });
    }

    const product = new Product({
      name,
      description,
      price,
      image,
      brand: brand.toLowerCase(),
      category: category ? category.toLowerCase() : 'otros'
    });

    await product.save();

    res.status(201).json({
      product,
      message: 'Product created successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/products/:id
 * Actualizar producto (solo admin/developer)
 */
router.put('/:id', verifyToken, authorize('admin', 'developer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, brand, category } = req.body;

    // Construir objeto de actualización
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (image !== undefined) updateData.image = image;
    if (brand !== undefined) {
      if (!['natura', 'avon', 'arbell'].includes(brand.toLowerCase())) {
        return res.status(400).json({
          message: 'Brand must be natura, avon, or arbell'
        });
      }
      updateData.brand = brand.toLowerCase();
    }
    if (category !== undefined) updateData.category = category.toLowerCase();

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      product,
      message: 'Product updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/products/:id
 * Eliminar producto (solo admin/developer)
 */
router.delete('/:id', verifyToken, authorize('admin', 'developer'), async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product deleted successfully',
      product
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

/**
 * RESUMEN DE ENDPOINTS:
 * 
 * PÚBLICOS:
 * - GET /api/products?brand=natura - Obtener productos por marca
 * 
 * PROTEGIDOS (admin/developer):
 * - GET /api/products/all - Todos los productos
 * - POST /api/products - Crear producto
 * - PUT /api/products/:id - Actualizar producto
 * - DELETE /api/products/:id - Eliminar producto
 */
