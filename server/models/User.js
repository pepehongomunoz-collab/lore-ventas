/**
 * USER MODEL - CON ROLES
 * 
 * CAMBIO PRINCIPAL: Agregado campo 'role'
 * 
 * ROLES DISPONIBLES:
 * - user: Usuario regular (por defecto)
 * - admin: Administrador
 * - developer: Desarrollador
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: false },
  address: {
    street: { type: String, required: false },
    number: { type: String, required: false },
    city: { type: String, required: false },
    postalCode: { type: String, required: false }
  },
  // NUEVO: Campo de rol
  // enum: solo permite estos 3 valores
  // default: 'user' - todos los nuevos usuarios son 'user'
  role: {
    type: String,
    enum: ['user', 'admin', 'developer'],
    default: 'user'
  },
  // NUEVO: Campos para recuperación de contraseña
  resetPasswordToken: { type: String, required: false },
  resetPasswordExpires: { type: Date, required: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
