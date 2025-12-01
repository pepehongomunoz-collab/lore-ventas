/**
 * SETTINGS ROUTES - Gestión de Configuración Global
 * 
 * Endpoints para gestionar configuraciones del sitio (colores, banners, etc.)
 * Solo usuarios con rol 'developer' pueden modificar configuraciones
 */

const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Valores por defecto para las configuraciones
const DEFAULT_SETTINGS = {
    siteColors: {
        primaryColor: '#f5a938',
        primaryHover: '#e08c1b',
        bodyBg: '#f8f9fb',
        headerGradientStart: '#eec17e',
        headerGradientEnd: '#f8f9fb',
        footerBg: 'rgba(221, 178, 138, 0.36)',
        accentBg: 'rgba(221, 178, 138, 0.36)'
    },
    banners: {
        natura: '/assets/img/bannernatura.png',
        avon: '/assets/img/banneravon.png',
        arbell: '/assets/img/bannerarbell.png'
    }
};

/**
 * GET /api/settings/:key
 * Obtener configuración por clave (público)
 */
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;

        let setting = await Settings.findOne({ key });

        // Si no existe, devolver valores por defecto
        if (!setting && DEFAULT_SETTINGS[key]) {
            return res.json({
                key,
                value: DEFAULT_SETTINGS[key],
                isDefault: true
            });
        }

        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' });
        }

        res.json({
            key: setting.key,
            value: setting.value,
            updatedAt: setting.updatedAt,
            isDefault: false
        });
    } catch (err) {
        console.error('Error fetching setting:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/settings/:key
 * Actualizar configuración (solo developer)
 */
router.put('/:key', verifyToken, authorize('developer'), async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (!value) {
            return res.status(400).json({ message: 'Value is required' });
        }

        // Validar que la key sea válida
        if (!DEFAULT_SETTINGS[key]) {
            return res.status(400).json({
                message: 'Invalid setting key',
                validKeys: Object.keys(DEFAULT_SETTINGS)
            });
        }

        // Actualizar o crear la configuración
        const setting = await Settings.findOneAndUpdate(
            { key },
            {
                key,
                value,
                updatedBy: req.user.userId,
                updatedAt: new Date()
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.json({
            message: 'Setting updated successfully',
            setting: {
                key: setting.key,
                value: setting.value,
                updatedAt: setting.updatedAt
            }
        });
    } catch (err) {
        console.error('Error updating setting:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/settings/reset/:key
 * Restaurar configuración a valores por defecto (solo developer)
 */
router.post('/reset/:key', verifyToken, authorize('developer'), async (req, res) => {
    try {
        const { key } = req.params;

        // Validar que la key sea válida
        if (!DEFAULT_SETTINGS[key]) {
            return res.status(400).json({
                message: 'Invalid setting key',
                validKeys: Object.keys(DEFAULT_SETTINGS)
            });
        }

        // Eliminar la configuración personalizada para volver a los valores por defecto
        await Settings.findOneAndDelete({ key });

        res.json({
            message: 'Setting reset to default values',
            key,
            value: DEFAULT_SETTINGS[key]
        });
    } catch (err) {
        console.error('Error resetting setting:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/settings
 * Obtener todas las configuraciones (público)
 */
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.find().lean();

        // Crear objeto con todas las configuraciones
        const allSettings = { ...DEFAULT_SETTINGS };

        // Sobrescribir con valores personalizados
        settings.forEach(setting => {
            allSettings[setting.key] = setting.value;
        });

        res.json({ settings: allSettings });
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

/**
 * RESUMEN DE ENDPOINTS:
 * 
 * PÚBLICOS:
 * - GET /api/settings - Obtener todas las configuraciones
 * - GET /api/settings/:key - Obtener configuración por clave
 * 
 * PROTEGIDOS (solo developer):
 * - PUT /api/settings/:key - Actualizar configuración
 * - POST /api/settings/reset/:key - Restaurar a valores por defecto
 */
