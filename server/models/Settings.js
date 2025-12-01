/**
 * SETTINGS MODEL - Configuración Global del Sitio
 * 
 * Modelo para almacenar configuraciones globales como colores y banners
 * Solo usuarios con rol 'developer' pueden modificar estas configuraciones
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índice para búsquedas rápidas por key
settingsSchema.index({ key: 1 });

module.exports = mongoose.model('Settings', settingsSchema);
