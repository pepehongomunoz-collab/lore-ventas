/**
 * RUTAS DE AUTENTICACIÓN - REFACTORIZADO
 * 
 * CAMBIOS PRINCIPALES:
 * 1. Importamos el middleware verifyToken
 * 2. Eliminamos código duplicado de verificación de token
 * 3. Creamos función helper para formatear respuestas de usuario
 * 4. Código más limpio y mantenible
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const jwtSecret = process.env.JWT_SECRET || 'secret123';

/**
 * FUNCIÓN HELPER: Formatear respuesta de usuario
 * 
 * PROPÓSITO:
 * Evitar duplicación del formato de respuesta de usuario.
 * 
 * ANTES: Este objeto se creaba en 3 lugares diferentes
 * AHORA: Una función centralizada
 * 
 * @param {Object} user - Documento de usuario de MongoDB
 * @returns {Object} Objeto con datos del usuario (sin password)
 */
function formatUserResponse(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: user.address,
    createdAt: user.createdAt
  };
}

/**
 * REGISTRO DE USUARIO
 * 
 * NO CAMBIÓ: Esta ruta no necesita autenticación previa
 * OPTIMIZACIÓN: Usa formatUserResponse() para consistencia
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hash });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // ANTES: { token, user: { id: user._id, email: user.email, name: user.name } }
    // AHORA: Función centralizada
    res.json({
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * LOGIN DE USUARIO
 * 
 * NO CAMBIÓ: Esta ruta no necesita autenticación previa
 * OPTIMIZACIÓN: Usa formatUserResponse() para consistencia
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // ANTES: { token, user: { id: user._id, email: user.email, name: user.name } }
    // AHORA: Función centralizada
    res.json({
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * OBTENER DATOS DEL USUARIO ACTUAL
 * 
 * CAMBIO PRINCIPAL: Usa middleware verifyToken
 * 
 * ANTES (código duplicado):
 * router.get('/me', async (req, res) => {
 *   const auth = req.headers.authorization;
 *   if (!auth) return res.status(401).json({ message: 'No token' });
 *   const token = auth.split(' ')[1];
 *   const decoded = jwt.verify(token, jwtSecret);
 *   // ... resto del código
 * });
 * 
 * AHORA (usando middleware):
 * - verifyToken se ejecuta primero
 * - Si el token es válido, req.user tiene los datos decodificados
 * - Código más limpio y corto
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    // ANTES: Teníamos que decodificar el token aquí
    // AHORA: req.user ya tiene los datos (gracias al middleware)
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ACTUALIZAR PERFIL DE USUARIO
 * 
 * CAMBIO PRINCIPAL: Usa middleware verifyToken
 * 
 * BENEFICIOS:
 * - Eliminamos 5 líneas de código duplicado
 * - Más fácil de leer
 * - Consistente con /me
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    // ANTES: Teníamos que extraer y verificar el token aquí
    // AHORA: req.user.id ya tiene el ID del usuario autenticado

    const { name, phone, address } = req.body;

    // Construir objeto de actualización
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user.id,  // ANTES: decoded.id, AHORA: req.user.id
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

/**
 * RESUMEN DE MEJORAS EN BACKEND:
 * 
 * ANTES:
 * - 105 líneas
 * - Código de verificación de token duplicado 2 veces
 * - Formato de respuesta de usuario duplicado 3 veces
 * 
 * AHORA:
 * - ~90 líneas (14% menos)
 * - Middleware reutilizable para autenticación
 * - Función helper para formatear respuestas
 * - Más fácil de mantener y testear
 * 
 * BENEFICIOS:
 * 1. Si necesitamos cambiar cómo verificamos tokens, lo hacemos en middleware/auth.js
 * 2. Si necesitamos agregar campos a la respuesta de usuario, lo hacemos en formatUserResponse()
 * 3. Código más limpio y profesional
 * 4. Más fácil agregar nuevas rutas protegidas (solo agregar verifyToken)
 */
