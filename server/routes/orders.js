const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authenticateToken, isAdminOrDeveloper } = require('../middleware/auth');

/**
 * GET /api/orders
 * Get all orders (admin only)
 */
router.get('/', authenticateToken, isAdminOrDeveloper, async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        // Build query
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos'
        });
    }
});

/**
 * GET /api/orders/stats
 * Get order statistics for dashboard (admin only)
 */
router.get('/stats', authenticateToken, isAdminOrDeveloper, async (req, res) => {
    try {
        // Total sales
        const totalSalesResult = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const totalSales = totalSalesResult[0]?.total || 0;

        // Orders by status
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Top products
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    brand: { $first: '$items.brand' },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        // Sales this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthSalesResult = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth },
                    status: { $ne: 'cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const monthSales = monthSalesResult[0]?.total || 0;

        // Total orders
        const totalOrders = await Order.countDocuments();

        res.json({
            success: true,
            stats: {
                totalSales,
                totalOrders,
                monthSales,
                ordersByStatus: ordersByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                topProducts
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

/**
 * GET /api/orders/:id
 * Get single order details (admin only)
 */
router.get('/:id', authenticateToken, isAdminOrDeveloper, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('statusHistory.changedBy', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedido'
        });
    }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (admin only)
 */
router.put('/:id/status', authenticateToken, isAdminOrDeveloper, async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        await order.updateStatus(status, req.user._id);

        res.json({
            success: true,
            message: 'Estado actualizado correctamente',
            order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado'
        });
    }
});

module.exports = router;
