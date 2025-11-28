/**
 * ADMIN AUTHENTICATION MIDDLEWARE
 * 
 * Middleware para verificar que el usuario tiene permisos de administrador
 * Debe usarse después del middleware de autenticación regular
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para verificar que el usuario es administrador
 * Requiere que el token JWT ya haya sido verificado
 */
const adminAuth = async (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Acceso denegado. No se proporcionó token de autenticación.'
            });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar el usuario en la base de datos
        // IMPORTANTE: El token puede tener 'id' o 'userId' dependiendo de cómo se generó
        const userId = decoded.userId || decoded.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado.'
            });
        }

        // Verificar que el usuario tiene rol de admin o developer
        if (user.role !== 'admin' && user.role !== 'developer') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado. Se requieren permisos de administrador.'
            });
        }

        // Agregar el usuario al request para uso posterior
        req.user = user;
        next();

    } catch (error) {
        console.error('Admin auth error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al verificar permisos de administrador.'
        });
    }
};

module.exports = adminAuth;
