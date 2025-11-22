const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

/**
 * @route   GET /api/users
 * @desc    Get all users (admin/developer only)
 * @access  Private (admin, developer)
 */
router.get('/', verifyToken, authorize('admin', 'developer'), async (req, res) => {
    try {
        // Get all users, excluding password field
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
});

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (admin/developer only)
 * @access  Private (admin, developer)
 */
router.put('/:id/role', verifyToken, authorize('admin', 'developer'), async (req, res) => {
    console.log('🔧 Role update request:', { userId: req.params.id, newRole: req.body.role, requester: req.user.email });
    try {
        const { role } = req.body;
        console.log('🔧 Received role update request body:', req.body);
        const userId = req.params.id;
        console.log('🔧 Target user ID:', userId);

        // Validate role
        const validRoles = ['user', 'admin', 'developer'];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Debe ser: user, admin o developer'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Prevent user from changing their own role
        if (userId === req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No puedes cambiar tu propio rol'
            });
        }

        // Only developers can create other developers
        if (role === 'developer' && req.user.role !== 'developer') {
            return res.status(403).json({
                success: false,
                message: 'Solo los desarrolladores pueden asignar el rol de desarrollador'
            });
        }

        // Log the change for audit
        console.log('🔎 Updating role:', { userId, currentRole: user.role, newRole: role });
        console.log('🔧 User before role change:', user);
        const previousRole = user.role;
        user.role = role;
        await user.save();
        console.log('🔧 User after role change:', user);
        console.log(`[AUDIT] User ${req.user.email} changed role of user ${user.email} from ${previousRole} to ${role}`);

        res.json({
            success: true,
            message: `Rol actualizado a ${role} exitosamente`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar rol de usuario'
        });
    }
});

module.exports = router;
