const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // User information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },

    // Order items
    items: [{
        productId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        brand: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],

    // Order totals
    total: {
        type: Number,
        required: true
    },

    // Shipping status
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },

    // Payment information
    paymentId: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    statusHistory: [{
        status: String,
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }]
});

// Update the updatedAt timestamp before saving
orderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Add method to update status
orderSchema.methods.updateStatus = function (newStatus, userId) {
    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        changedBy: userId,
        changedAt: new Date()
    });
    return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
