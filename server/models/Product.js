/**
 * PRODUCT MODEL - ACTUALIZADO
 * 
 * Modelo para productos de las marcas Natura, Avon y Arbell
 */

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true,
    enum: ['natura', 'avon', 'arbell'],
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    enum: ['maquillaje', 'perfumeria', 'cuidados', 'otros'],
    default: 'otros',
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice de texto para búsqueda eficiente
ProductSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text'
});

module.exports = mongoose.model('Product', ProductSchema);
