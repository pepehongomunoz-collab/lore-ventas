/**
 * TRANSACTION MODEL
 * 
 * Modelo para almacenar todas las transacciones de la plataforma
 * Incluye información de pagos, productos, clientes y estados
 */

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  // ID de la transacción de MercadoPago
  transactionId: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  
  // ID del pago de MercadoPago (puede ser diferente al transactionId)
  paymentId: { 
    type: String, 
    required: false 
  },
  
  // Usuario que realizó la compra (puede ser null para compras sin login)
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false 
  },
  
  // Información del cliente
  customerInfo: {
    email: { type: String, required: false },
    name: { type: String, required: false },
    phone: { type: String, required: false }
  },
  
  // Items comprados
  items: [{
    title: { type: String, required: true },
    description: { type: String, required: false },
    unit_price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true } // unit_price * quantity
  }],
  
  // Montos
  amount: { 
    type: Number, 
    required: true 
  },
  
  // Estado de la transacción
  // pending: Pago pendiente
  // approved: Pago aprobado
  // rejected: Pago rechazado
  // cancelled: Pago cancelado
  // refunded: Pago reembolsado
  // in_process: En proceso
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process'],
    default: 'pending',
    index: true
  },
  
  // Historial de cambios de estado
  statusHistory: [{
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin que cambió el estado
    note: { type: String, required: false }
  }],
  
  // Método de pago
  paymentMethod: { 
    type: String, 
    required: false 
  },
  
  // Tipo de pago (credit_card, debit_card, ticket, etc.)
  paymentType: { 
    type: String, 
    required: false 
  },
  
  // Notas administrativas
  notes: { 
    type: String, 
    required: false 
  },
  
  // Datos adicionales del webhook
  webhookData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para mejorar las consultas
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ 'customerInfo.email': 1 });

// Método para agregar un cambio de estado al historial
TransactionSchema.methods.addStatusChange = function(newStatus, changedBy, note) {
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: changedBy,
    note: note
  });
  this.status = newStatus;
};

module.exports = mongoose.model('Transaction', TransactionSchema);
