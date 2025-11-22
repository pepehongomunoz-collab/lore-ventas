/**
 * RUTAS DE AUTENTICACIÓN - CON ROLES
 * 
 * NUEVAS FUNCIONALIDADES:
 * 1. Role incluido en JWT tokens
 * 2. Endpoints de administración para gestionar usuarios
 * 3. Cambio de roles (solo admin/developer)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

const jwtSecret = process.env.JWT_SECRET || 'secret123';

/**
 * ACTUALIZADO: Incluye role en la respuesta
 */
function formatUserResponse(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: user.address,
    role: user.role,  // NUEVO: Incluir rol
    createdAt: user.createdAt
  };
}

/**
 * REGISTRO DE USUARIO
 * Todos los nuevos usuarios son 'user' por defecto
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

    // El rol 'user' se asigna automáticamente por el default en el modelo
    const user = new User({ name, email, password: hash });
    await user.save();

    // ACTUALIZADO: Incluir role en el JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role  // NUEVO: Incluir rol en el token
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

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

    // ACTUALIZADO: Incluir role en el JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role  // NUEVO: Incluir rol en el token
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

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
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
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
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    // Construir objeto de actualización
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user.id,
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

/**
 * NUEVO: LISTAR TODOS LOS USUARIOS
 * Solo accesible para admin y developer
 * 
 * EXPLICACIÓN:
 * - verifyToken: verifica que el usuario esté autenticado
 * - authorize('admin', 'developer'): verifica que tenga uno de estos roles
 */
router.get('/users', verifyToken, authorize('admin', 'developer'), async (req, res) => {
  try {
    // Obtener todos los usuarios sin el password
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      users,
      count: users.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * NUEVO: CAMBIAR ROL DE UN USUARIO
 * Solo accesible para admin y developer
 * 
 * EXPLICACIÓN:
 * Permite cambiar el rol de cualquier usuario.
 * Los admin pueden cambiar a 'user' o 'admin'.
 * Los developer pueden cambiar a cualquier rol.
 */
router.put('/users/:id/role', verifyToken, authorize('admin', 'developer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar que el rol sea válido
    if (!['user', 'admin', 'developer'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be: user, admin, or developer'
      });
    }

    // RESTRICCIÓN: Solo developers pueden crear otros developers
    if (role === 'developer' && req.user.role !== 'developer') {
      return res.status(403).json({
        message: 'Only developers can assign developer role'
      });
    }

    // Actualizar el rol
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user,
      message: `User role updated to ${role}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * NUEVO: CAMBIAR CONTRASEÑA
 * Permite al usuario cambiar su contraseña después de validar la contraseña actual
 * 
 * EXPLICACIÓN:
 * - Requiere autenticación (verifyToken)
 * - Valida que la contraseña actual sea correcta
 * - Valida que la nueva contraseña tenga al menos 6 caracteres
 * - Hashea y actualiza la contraseña
 */
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validar que se enviaron ambas contraseñas
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Se requieren la contraseña actual y la nueva contraseña'
      });
    }

    // Validar longitud mínima de la nueva contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Obtener el usuario de la base de datos
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que la contraseña actual sea correcta
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

/**
 * NUEVO: RESETEAR CONTRASEÑA DE USUARIO (ADMIN/DEVELOPER)
 * Permite a administradores resetear la contraseña de cualquier usuario a un valor por defecto
 * 
 * EXPLICACIÓN:
 * - Solo accesible para admin y developer
 * - Resetea la contraseña a "1234abcd"
 * - El usuario puede cambiarla después desde su perfil
 */
router.put('/users/:id/reset-password', verifyToken, authorize('admin', 'developer'), async (req, res) => {
  try {
    const { id } = req.params;
    const defaultPassword = '1234abcd';

    // Obtener el usuario
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Hashear la contraseña por defecto
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Actualizar la contraseña
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: `Contraseña de ${user.email} reseteada exitosamente`,
      defaultPassword: defaultPassword  // Enviar la contraseña temporal para mostrar al admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ------------------------------------------------------------
// 1️⃣  Solicitar recuperación de contraseña
// ------------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Respuesta genérica para evitar enumeración de usuarios
    if (!user) {
      return res.json({ message: 'If the email exists, you will receive a reset link' });
    }

    // Generar token y hash
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 2 * 60 * 60 * 1000; // 2 horas
    await user.save();

    // Enviar email de recuperación
    await sendPasswordResetEmail(user.email, resetToken);
    res.json({ message: 'If the email exists, you will receive a reset link' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// 2️⃣  Restablecer contraseña con token
// ------------------------------------------------------------
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

/**
 * RESUMEN DE ENDPOINTS:
 * 
 * PÚBLICOS (sin autenticación):
 * - POST /api/auth/register - Registrar nuevo usuario
 * - POST /api/auth/login - Iniciar sesión
 * 
 * PROTEGIDOS (requieren token):
 * - GET /api/auth/me - Obtener datos del usuario actual
 * - PUT /api/auth/profile - Actualizar perfil
 * 
 * ADMIN/DEVELOPER (requieren token + rol):
 * - GET /api/auth/users - Listar todos los usuarios
 * - PUT /api/auth/users/:id/role - Cambiar rol de un usuario
 */
