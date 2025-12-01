const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const adminAuth = require('../middleware/adminAuth');
const { verifyToken } = require('../middleware/auth');

/**
 * USER ROUTES - Para usuarios regulares
 */

/**
 * GET /api/transactions/my-orders
 * Obtener pedidos del usuario autenticado
 * Query params:
 *   - status: filtrar por estado
 *   - limit: límite de resultados (default: 50)
 */
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        const userId = req.user.userId || req.user.id;

        // Construir filtro
        const filter = {};

        // Buscar por userId O por email del usuario
        const User = require('../models/User');
        const user = await User.findById(userId);

        if (user) {
            filter.$or = [
                { userId: userId },
                { 'customerInfo.email': user.email }
            ];
        } else {
            filter.userId = userId;
        }

        if (status) {
            filter.status = status;
        }

        // Obtener transacciones del usuario
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('-webhookData -statusHistory.changedBy') // No mostrar datos sensibles
            .lean();

        // Contar total
        const total = await Transaction.countDocuments(filter);

        // Calcular estadísticas del usuario
        const stats = {
            total: total,
            pending: 0,
            approved: 0,
            rejected: 0,
            in_process: 0
        };

        transactions.forEach(t => {
            if (stats[t.status] !== undefined) {
                stats[t.status]++;
            }
        });

        res.json({
            success: true,
            orders: transactions,
            stats,
            total
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener tus pedidos'
        });
    }
});

/**
 * GET /api/transactions/my-orders/:id
 * Obtener detalles de un pedido específico del usuario
 */
router.get('/my-orders/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const transaction = await Transaction.findById(req.params.id)
            .select('-webhookData') // No mostrar datos del webhook
            .lean();

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado'
            });
        }

        // Verificar que el pedido pertenece al usuario
        const User = require('../models/User');
        const user = await User.findById(userId);

        const isOwner = transaction.userId?.toString() === userId.toString() ||
            (user && transaction.customerInfo?.email === user.email);

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver este pedido'
            });
        }

        res.json({
            success: true,
            order: transaction
        });

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalles del pedido'
        });
    }
});

/**
 * ADMIN ROUTES - Solo para administradores
 */


/**
 * GET /api/transactions
 * Obtener todas las transacciones con filtros opcionales
 * Query params:
 *   - status: filtrar por estado
 *   - startDate: fecha inicial
 *   - endDate: fecha final
 *   - search: buscar por email o transactionId
 *   - limit: límite de resultados (default: 100)
 *   - skip: saltar resultados para paginación
 */
router.get('/', adminAuth, async (req, res) => {
    try {
        const { status, startDate, endDate, search, limit = 100, skip = 0 } = req.query;

        // Construir filtro
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        if (search) {
            filter.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { 'customerInfo.email': { $regex: search, $options: 'i' } },
                { 'customerInfo.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Obtener transacciones
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('userId', 'name email')
            .lean();

        // Contar total de transacciones que coinciden con el filtro
        const total = await Transaction.countDocuments(filter);

        res.json({
            success: true,
            transactions,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: total > (parseInt(skip) + parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener transacciones'
        });
    }
});

/**
 * GET /api/transactions/stats
 * Obtener estadísticas y balance comercial
 */
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Construir filtro de fecha si se proporciona
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                dateFilter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.createdAt.$lte = new Date(endDate);
            }
        }

        // Obtener estadísticas por estado
        const stats = await Transaction.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Calcular totales generales
        const totalTransactions = await Transaction.countDocuments(dateFilter);
        const totalAmount = await Transaction.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Calcular monto aprobado (solo transacciones aprobadas)
        const approvedAmount = await Transaction.aggregate([
            { $match: { ...dateFilter, status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Formatear estadísticas por estado
        const statsByStatus = {
            pending: { count: 0, amount: 0 },
            approved: { count: 0, amount: 0 },
            rejected: { count: 0, amount: 0 },
            cancelled: { count: 0, amount: 0 },
            refunded: { count: 0, amount: 0 },
            in_process: { count: 0, amount: 0 }
        };

        stats.forEach(stat => {
            if (statsByStatus[stat._id]) {
                statsByStatus[stat._id] = {
                    count: stat.count,
                    amount: stat.totalAmount
                };
            }
        });

        // Obtener transacciones recientes (últimas 5)
        const recentTransactions = await Transaction.find(dateFilter)
            .sort({ createdAt: -1 })
            .limit(5)
            .select('transactionId customerInfo amount status createdAt')
            .lean();

        res.json({
            success: true,
            stats: {
                total: {
                    transactions: totalTransactions,
                    amount: totalAmount[0]?.total || 0
                },
                approved: {
                    transactions: statsByStatus.approved.count,
                    amount: approvedAmount[0]?.total || 0
                },
                byStatus: statsByStatus,
                recent: recentTransactions
            }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

/**
 * GET /api/transactions/:id
 * Obtener detalles de una transacción específica
 */
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('userId', 'name email phone address')
            .populate('statusHistory.changedBy', 'name email')
            .lean();

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transacción no encontrada'
            });
        }

        res.json({
            success: true,
            transaction
        });

    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener transacción'
        });
    }
});

/**
 * PUT /api/transactions/:id/status
 * Actualizar el estado de una transacción
 * Body: { status: string, note?: string }
 */
router.put('/:id/status', adminAuth, async (req, res) => {
    try {
        const { status, note } = req.body;

        // Validar estado
        const validStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Estado inválido'
            });
        }

        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transacción no encontrada'
            });
        }

        // Usar el método del modelo para agregar el cambio de estado
        transaction.addStatusChange(status, req.user._id, note);
        await transaction.save();

        res.json({
            success: true,
            message: 'Estado actualizado correctamente',
            transaction
        });

    } catch (error) {
        console.error('Error updating transaction status:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar estado de transacción'
        });
    }
});

/**
 * PUT /api/transactions/:id/notes
 * Actualizar las notas de una transacción
 * Body: { notes: string }
 */
router.put('/:id/notes', adminAuth, async (req, res) => {
    try {
        const { notes } = req.body;

        const transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { notes },
            { new: true }
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transacción no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Notas actualizadas correctamente',
            transaction
        });

    } catch (error) {
        console.error('Error updating transaction notes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar notas de transacción'
        });
    }
});

/**
 * PUT /api/transactions/:id/shipping
 * Actualizar información de envío de una transacción
 * Body: { shippingStatus?: string, trackingNumber?: string, note?: string }
 */
router.put('/:id/shipping', adminAuth, async (req, res) => {
    try {
        const { shippingStatus, trackingNumber, note } = req.body;

        // Validar estado de envío si se proporciona
        const validShippingStatuses = ['pending', 'preparing', 'dispatched', 'in_transit', 'delivered'];
        if (shippingStatus && !validShippingStatuses.includes(shippingStatus)) {
            return res.status(400).json({
                success: false,
                error: 'Estado de envío inválido'
            });
        }

        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transacción no encontrada'
            });
        }

        // Usar el método del modelo para actualizar información de envío
        transaction.updateShipping(shippingStatus, trackingNumber, req.user._id, note);
        await transaction.save();

        res.json({
            success: true,
            message: 'Información de envío actualizada correctamente',
            transaction
        });

    } catch (error) {
        console.error('Error updating shipping info:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar información de envío'
        });
    }
});

module.exports = router;
