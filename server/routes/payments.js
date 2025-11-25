const express = require('express');
const router = express.Router();
const { vexor } = require('../lib/vexor');

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

        // Here you would typically:
        // 1. Update order status in database
        // 2. Send confirmation email
        // 3. Update inventory
        // 4. Trigger any business logic based on payment status

        // Example: Log different payment statuses
        switch (webhookData.status) {
            case 'approved':
                console.log(`Payment ${webhookData.payment_id} approved`);
                // Update order status to paid
                break;
            case 'pending':
                console.log(`Payment ${webhookData.payment_id} pending`);
                // Keep order as pending
                break;
            case 'rejected':
                console.log(`Payment ${webhookData.payment_id} rejected`);
                // Mark order as failed
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
