/**
 * HEALTH CHECK ROUTE
 * Endpoint para verificar el estado del servidor y la base de datos
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * GET /api/health
 * Verifica el estado del servidor y la conexión a la base de datos
 */
router.get('/', (req, res) => {
    try {
        // Verificar estado de la conexión a MongoDB
        const dbState = mongoose.connection.readyState;
        const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

        // Respuesta de salud
        const healthCheck = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbStatus,
            environment: process.env.NODE_ENV || 'development'
        };

        res.status(200).json(healthCheck);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

module.exports = router;
