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

module.exports = router;
