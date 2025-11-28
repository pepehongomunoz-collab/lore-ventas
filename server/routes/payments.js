const express = require('express');
const router = express.Router();
const { vexor } = require('../lib/vexor');
const Transaction = require('../models/Transaction');

/**
 * POST /api/payments/create
 * Creates a payment using Vexor with MercadoPago
 * 
 * Request body:
 * {
 *   items: [
 *     {
 *       title: string (required),
 *       unit_price: number (required),
 *       quantity: number (required),
 *       description?: string
 *     }
 *   ],
 *   successRedirect?: string,
 *   failureRedirect?: string
 * }
 */
router.post('/create', async (req, res) => {
    try {
        const { items, successRedirect, failureRedirect } = req.body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Items array is required and must not be empty'
            });
        }

        // Validate each item has required MercadoPago fields
        for (const item of items) {
            if (!item.title || typeof item.title !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Each item must have a title (string)'
                });
            }
            if (!item.unit_price || typeof item.unit_price !== 'number') {
                return res.status(400).json({
                    success: false,
                    error: 'Each item must have a unit_price (number)'
                });
            }
            if (!item.quantity || typeof item.quantity !== 'number') {
                return res.status(400).json({
                    success: false,
                    error: 'Each item must have a quantity (number)'
                });
            }
        }

        // Prepare options for Vexor
        const options = {};
        if (successRedirect) {
            options.successRedirect = successRedirect;
        }
        if (failureRedirect) {
            options.failureRedirect = failureRedirect;
        }

        // Create payment using Vexor's MercadoPago integration
        const paymentData = {
            items: items
        };

        if (Object.keys(options).length > 0) {
            paymentData.options = options;
        }

        const response = await vexor.pay.mercadopago(paymentData);

        // Return the payment URL to the client
        res.json({
            success: true,
            payment_url: response.payment_url,
            payment_id: response.payment_id
        });

    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment',
            message: error.message
        });
    }
});

/**
 * POST /api/payments/webhook
 * Handles payment notifications from MercadoPago via Vexor
 * 
 * Vexor handles webhook signature validation automatically
 */
router.post('/webhook', async (req, res) => {
    try {
        // Use Vexor's webhook handler to process the payment notification
        const webhookData = await vexor.webhook(req.body);

        // Log the webhook event
        console.log('Payment webhook received:', {
            event: webhookData.event,
            payment_id: webhookData.payment_id,
            status: webhookData.status
        });

        // Crear o actualizar transacción en la base de datos
        try {
            // Buscar si ya existe una transacción con este payment_id
            let transaction = await Transaction.findOne({
                $or: [
                    { transactionId: webhookData.payment_id },
                    { paymentId: webhookData.payment_id }
                ]
            });

            if (transaction) {
                // Actualizar transacción existente
                console.log(`Updating existing transaction: ${transaction._id}`);

                // Solo actualizar si el estado cambió
                if (transaction.status !== webhookData.status) {
                    transaction.addStatusChange(
                        webhookData.status,
                        null, // No hay usuario admin, es automático
                        `Estado actualizado automáticamente por webhook de MercadoPago`
                    );
                    await transaction.save();
                    console.log(`Transaction status updated to: ${webhookData.status}`);
                }
            } else {
                // Crear nueva transacción
                console.log(`Creating new transaction for payment: ${webhookData.payment_id}`);

                // Extraer información del webhook
                const items = webhookData.items || [];
                const amount = webhookData.amount || 0;
                const customerEmail = webhookData.payer?.email || webhookData.email;
                const customerName = webhookData.payer?.name || webhookData.payer?.first_name;

                transaction = new Transaction({
                    transactionId: webhookData.payment_id,
                    paymentId: webhookData.payment_id,
                    customerInfo: {
                        email: customerEmail,
                        name: customerName,
                        phone: webhookData.payer?.phone?.number
                    },
                    items: items.map(item => ({
                        title: item.title,
                        description: item.description,
                        unit_price: item.unit_price,
                        quantity: item.quantity,
                        subtotal: item.unit_price * item.quantity
                    })),
                    amount: amount,
                    status: webhookData.status,
                    paymentMethod: webhookData.payment_method_id,
                    paymentType: webhookData.payment_type_id,
                    webhookData: webhookData, // Guardar todos los datos del webhook
                    statusHistory: [{
                        status: webhookData.status,
                        changedAt: new Date(),
                        note: 'Transacción creada desde webhook de MercadoPago'
                    }]
                });

                await transaction.save();
                console.log(`Transaction created successfully: ${transaction._id}`);
            }
        } catch (dbError) {
            console.error('Error saving transaction to database:', dbError);
            // No fallar el webhook si hay error en la BD
            // MercadoPago necesita recibir 200 OK
        }

        // Lógica de negocio basada en el estado del pago
        switch (webhookData.status) {
            case 'approved':
                console.log(`Payment ${webhookData.payment_id} approved`);
                // TODO: Enviar email de confirmación
                // TODO: Actualizar inventario
                break;
            case 'pending':
                console.log(`Payment ${webhookData.payment_id} pending`);
                // TODO: Enviar email de pago pendiente
                break;
            case 'rejected':
                console.log(`Payment ${webhookData.payment_id} rejected`);
                // TODO: Enviar email de pago rechazado
                break;
            default:
                console.log(`Payment ${webhookData.payment_id} status: ${webhookData.status}`);
        }

        // Respond to Vexor/MercadoPago that webhook was received
        res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process webhook'
        });
    }
});

/**
 * GET /api/payments/status/:paymentId
 * Retrieves the status of a payment
 */
router.get('/status/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                error: 'Payment ID is required'
            });
        }

        // Note: Vexor doesn't have a built-in status check method in the current docs
        // You would typically query your database for the order status
        // or use MercadoPago SDK directly if needed

        res.json({
            success: true,
            message: 'Status check endpoint - implement based on your database schema',
            payment_id: paymentId
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check payment status'
        });
    }
});

/**
 * POST /api/payments/create-test-order
 * Crea una transacción de prueba sin usar dinero real
 * Solo para desarrollo/testing
 * 
 * Request body:
 * {
 *   items: array de productos (opcional, usa carrito si no se proporciona)
 * }
 */
router.post('/create-test-order', async (req, res) => {
    try {
        // Verificar autenticación
        const { verifyToken } = require('../middleware/auth');

        // Extraer token manualmente
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Autenticación requerida'
            });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        // Obtener items del body o usar items de prueba
        let items = req.body.items;

        if (!items || items.length === 0) {
            // Items de prueba por defecto
            items = [
                {
                    title: 'Producto de Prueba 1',
                    description: 'Este es un producto de prueba',
                    unit_price: 100,
                    quantity: 2,
                    subtotal: 200
                },
                {
                    title: 'Producto de Prueba 2',
                    description: 'Otro producto de prueba',
                    unit_price: 50,
                    quantity: 1,
                    subtotal: 50
                }
            ];
        } else {
            // Asegurar que los items tengan subtotal
            items = items.map(item => ({
                ...item,
                subtotal: item.unit_price * item.quantity
            }));
        }

        // Calcular total
        const amount = items.reduce((sum, item) => sum + item.subtotal, 0);

        // Obtener información del usuario
        const User = require('../models/User');
        const user = await User.findById(userId);

        // Crear transacción de prueba
        const testTransaction = new Transaction({
            transactionId: 'TEST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            paymentId: 'TEST_PAYMENT_' + Date.now(),
            userId: userId,
            customerInfo: {
                email: user?.email || 'test@example.com',
                name: user?.name || 'Usuario de Prueba',
                phone: user?.phone || '1234567890'
            },
            items: items,
            amount: amount,
            status: 'approved', // Por defecto aprobado para testing
            paymentMethod: 'test_card',
            paymentType: 'credit_card',
            statusHistory: [{
                status: 'approved',
                changedAt: new Date(),
                note: 'Transacción de prueba creada automáticamente'
            }],
            notes: '⚠️ TRANSACCIÓN DE PRUEBA - No involucra dinero real'
        });

        await testTransaction.save();

        console.log('✅ Test transaction created:', testTransaction._id);

        res.json({
            success: true,
            message: 'Transacción de prueba creada exitosamente',
            transaction: {
                id: testTransaction._id,
                transactionId: testTransaction.transactionId,
                amount: testTransaction.amount,
                status: testTransaction.status,
                items: testTransaction.items
            }
        });

    } catch (error) {
        console.error('Error creating test order:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear transacción de prueba',
            message: error.message
        });
    }
});

module.exports = router;
