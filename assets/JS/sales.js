/**
 * SALES.JS - Sales Management Module
 * 
 * Handles sales/orders management functionality for admins and developers
 */

import { API_BASE, getAuthToken, getUserData, isAdminOrDeveloper, redirectToHome } from './utils.js';

let currentUser = null;
let allOrders = [];

/**
 * Initialize sales page
 */
export async function initSalesPage() {
    // Verify user is admin or developer
    currentUser = getUserData();

    if (!currentUser || !isAdminOrDeveloper()) {
        alert('No tienes permisos para acceder a esta página');
        redirectToHome();
        return;
    }

    // Load initial data
    await loadDashboardStats();
    await loadOrders();

    // Setup event listeners
    setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Status filter
    document.getElementById('status-filter')?.addEventListener('change', filterOrders);

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', async () => {
        await loadOrders();
        await loadDashboardStats();
    });

    // Modal close
    document.querySelector('.modal-close')?.addEventListener('click', closeModal);
    document.getElementById('order-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'order-modal') {
            closeModal();
        }
    });
}

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/api/orders/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }

        const data = await response.json();
        renderDashboard(data.stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Render dashboard metrics
 */
function renderDashboard(stats) {
    const container = document.getElementById('dashboard-metrics');
    if (!container) return;

    const metrics = [
        {
            title: 'Ventas Totales',
            value: `$${stats.totalSales.toLocaleString('es-AR')}`,
            icon: 'fa-dollar-sign',
            color: 'primary'
        },
        {
            title: 'Pedidos Totales',
            value: stats.totalOrders,
            icon: 'fa-shopping-bag',
            color: 'info'
        },
        {
            title: 'Ventas del Mes',
            value: `$${stats.monthSales.toLocaleString('es-AR')}`,
            icon: 'fa-calendar',
            color: 'success'
        },
        {
            title: 'Pendientes',
            value: stats.ordersByStatus.pending || 0,
            icon: 'fa-clock',
            color: 'warning'
        }
    ];

    container.innerHTML = metrics.map(metric => `
        <div class="metric-card metric-${metric.color}">
            <div class="metric-icon">
                <i class="fa-solid ${metric.icon}"></i>
            </div>
            <div class="metric-info">
                <h3>${metric.value}</h3>
                <p>${metric.title}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Load all orders
 */
async function loadOrders() {
    const loadingEl = document.getElementById('sales-loading');
    const errorEl = document.getElementById('sales-error');
    const tableEl = document.getElementById('orders-table-container');

    try {
        loadingEl.style.display = 'flex';
        errorEl.style.display = 'none';
        tableEl.style.display = 'none';

        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/api/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar pedidos');
        }

        const data = await response.json();
        allOrders = data.orders;

        loadingEl.style.display = 'none';
        tableEl.style.display = 'block';

        renderOrdersTable(allOrders);
    } catch (error) {
        console.error('Error loading orders:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'flex';
        document.getElementById('error-message').textContent = error.message;
    }
}

/**
 * Filter orders by status
 */
function filterOrders() {
    const statusFilter = document.getElementById('status-filter').value;

    let filteredOrders = allOrders;
    if (statusFilter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === statusFilter);
    }

    renderOrdersTable(filteredOrders);
}

/**
 * Render orders table
 */
function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #888;">
                    <i class="fa-solid fa-inbox" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                    No hay pedidos para mostrar
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString('es-AR');
        const statusBadge = getStatusBadge(order.status);

        return `
            <tr>
                <td><code>${order._id.substring(0, 8)}...</code></td>
                <td>
                    <div><strong>${order.userName}</strong></div>
                    <div style="font-size: 12px; color: #666;">${order.userEmail}</div>
                </td>
                <td>${date}</td>
                <td><strong>$${order.total.toLocaleString('es-AR')}</strong></td>
                <td>${statusBadge}</td>
                <td class="actions-cell">
                    <button class="btn-view" data-order-id="${order._id}">
                        <i class="fa-solid fa-eye"></i> Ver
                    </button>
                    <select class="status-selector" data-order-id="${order._id}">
                        <option value="">Cambiar estado...</option>
                        <option value="pending" ${order.status === 'pending' ? 'disabled' : ''}>Pendiente</option>
                        <option value="processing" ${order.status === 'processing' ? 'disabled' : ''}>Procesando</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'disabled' : ''}>Enviado</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'disabled' : ''}>Entregado</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'disabled' : ''}>Cancelado</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('');

    // Add event listeners
    tbody.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => viewOrderDetail(btn.dataset.orderId));
    });

    tbody.querySelectorAll('.status-selector').forEach(select => {
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                updateOrderStatus(e.target.dataset.orderId, e.target.value);
            }
        });
    });
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        pending: { label: 'Pendiente', class: 'status-pending' },
        processing: { label: 'Procesando', class: 'status-processing' },
        shipped: { label: 'Enviado', class: 'status-shipped' },
        delivered: { label: 'Entregado', class: 'status-delivered' },
        cancelled: { label: 'Cancelado', class: 'status-cancelled' }
    };

    const badge = badges[status] || { label: status, class: 'status-default' };
    return `<span class="status-badge ${badge.class}">${badge.label}</span>`;
}

/**
 * View order detail
 */
async function viewOrderDetail(orderId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar detalle del pedido');
        }

        const data = await response.json();
        renderOrderDetail(data.order);
        openModal();
    } catch (error) {
        console.error('Error loading order detail:', error);
        alert('Error al cargar detalle del pedido');
    }
}

/**
 * Render order detail in modal
 */
function renderOrderDetail(order) {
    const container = document.getElementById('order-detail');
    if (!container) return;

    const date = new Date(order.createdAt).toLocaleString('es-AR');

    container.innerHTML = `
        <h2>Detalle del Pedido</h2>
        <div class="order-detail-section">
            <h3><i class="fa-solid fa-info-circle"></i> Información General</h3>
            <p><strong>ID:</strong> <code>${order._id}</code></p>
            <p><strong>Fecha:</strong> ${date}</p>
            <p><strong>Estado:</strong> ${getStatusBadge(order.status)}</p>
            <p><strong>Total:</strong> <strong>$${order.total.toLocaleString('es-AR')}</strong></p>
        </div>

        <div class="order-detail-section">
            <h3><i class="fa-solid fa-user"></i> Cliente</h3>
            <p><strong>Nombre:</strong> ${order.userName}</p>
            <p><strong>Email:</strong> ${order.userEmail}</p>
        </div>

        <div class="order-detail-section">
            <h3><i class="fa-solid fa-shopping-bag"></i> Productos</h3>
            <table class="order-items-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Marca</th>
                        <th>Precio</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.brand}</td>
                            <td>$${item.price.toLocaleString('es-AR')}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.subtotal.toLocaleString('es-AR')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="order-detail-section">
            <h3><i class="fa-solid fa-credit-card"></i> Información de Pago</h3>
            <p><strong>ID de Pago:</strong> <code>${order.paymentId}</code></p>
            <p><strong>Estado de Pago:</strong> ${order.paymentStatus}</p>
            <p><strong>Método:</strong> ${order.paymentMethod || 'MercadoPago'}</p>
        </div>
    `;
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, newStatus) {
    const confirmed = confirm(`¿Estás seguro de cambiar el estado a "${getStatusLabel(newStatus)}"?`);
    if (!confirmed) {
        // Reset select
        document.querySelector(`[data-order-id="${orderId}"]`).value = '';
        return;
    }

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al actualizar estado');
        }

        showNotification('Estado actualizado correctamente', 'success');
        await loadOrders();
        await loadDashboardStats();
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification(error.message, 'error');
        // Reset select
        document.querySelector(`[data-order-id="${orderId}"]`).value = '';
    }
}

/**
 * Get status label
 */
function getStatusLabel(status) {
    const labels = {
        pending: 'Pendiente',
        processing: 'Procesando',
        shipped: 'Enviado',
        delivered: 'Entregado',
        cancelled: 'Cancelado'
    };
    return labels[status] || status;
}

/**
 * Open modal
 */
function openModal() {
    document.getElementById('order-modal').style.display = 'flex';
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('order-modal').style.display = 'none';
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');
    const icon = notification.querySelector('i');

    messageEl.textContent = message;
    notification.className = `notification ${type}`;

    if (type === 'success') {
        icon.className = 'fa-solid fa-check-circle';
    } else {
        icon.className = 'fa-solid fa-exclamation-circle';
    }

    notification.style.display = 'flex';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}
