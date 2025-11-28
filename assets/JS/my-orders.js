/**
 * MY ORDERS MODULE
 * 
 * Módulo para que los usuarios vean su historial de compras
 */

const API_URL = 'http://localhost:3000/api';

let currentOrder = null;

/**
 * Inicializar la página
 */
async function init() {
    console.log('Initializing my orders page...');

    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión para ver tus compras');
        window.location.href = './login.html';
        return;
    }

    // Cargar pedidos
    await loadOrders();
}

/**
 * Cargar pedidos del usuario
 */
async function loadOrders(filters = {}) {
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    const ordersList = document.getElementById('orders-list');

    try {
        // Mostrar loading
        if (loading) loading.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        if (ordersList) ordersList.style.display = 'none';

        const token = localStorage.getItem('token');

        // Construir query string
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);

        const response = await fetch(`${API_URL}/transactions/my-orders?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                localStorage.removeItem('token');
                window.location.href = './login.html';
                return;
            }
            throw new Error('Error al cargar pedidos');
        }

        const data = await response.json();

        // Ocultar loading
        if (loading) loading.style.display = 'none';

        if (data.success && data.orders.length > 0) {
            displayOrders(data.orders);
            displayStats(data.stats);
            if (ordersList) ordersList.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'block';
        }

    } catch (error) {
        console.error('Error loading orders:', error);
        if (loading) loading.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fa-solid fa-exclamation-triangle"></i>
                <h3>Error al cargar pedidos</h3>
                <p>${error.message}</p>
            `;
        }
    }
}

/**
 * Mostrar estadísticas
 */
function displayStats(stats) {
    const totalOrders = document.getElementById('total-orders');
    const pendingOrders = document.getElementById('pending-orders');
    const approvedOrders = document.getElementById('approved-orders');

    if (totalOrders) totalOrders.textContent = stats.total || 0;
    if (pendingOrders) pendingOrders.textContent = (stats.pending || 0) + (stats.in_process || 0);
    if (approvedOrders) approvedOrders.textContent = stats.approved || 0;
}

/**
 * Mostrar lista de pedidos
 */
function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    ordersList.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const itemsCount = order.items?.length || 0;
        const itemsText = itemsCount === 1 ? '1 producto' : `${itemsCount} productos`;

        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-number">Pedido #${order.transactionId.substring(0, 12)}...</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <span class="status-badge ${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="order-body">
                    <div class="order-items">
                        <i class="fa-solid fa-box"></i> ${itemsText}
                    </div>
                    <div class="order-total">$${order.amount.toFixed(2)}</div>
                    <div class="order-actions">
                        <button class="btn-view-order" onclick="viewOrder('${order._id}')">
                            <i class="fa-solid fa-eye"></i> Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Obtener texto del estado en español
 */
function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'approved': 'Aprobado',
        'rejected': 'Rechazado',
        'cancelled': 'Cancelado',
        'refunded': 'Reembolsado',
        'in_process': 'En Proceso'
    };
    return statusMap[status] || status;
}

/**
 * Aplicar filtros
 */
window.applyFilters = async function () {
    const status = document.getElementById('filter-status')?.value;

    const filters = {};
    if (status) filters.status = status;

    await loadOrders(filters);
}

/**
 * Ver detalles de un pedido
 */
window.viewOrder = async function (orderId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/transactions/my-orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar detalles del pedido');
        }

        const data = await response.json();

        if (data.success) {
            currentOrder = data.order;
            showOrderModal(data.order);
        }
    } catch (error) {
        console.error('Error viewing order:', error);
        alert('Error al cargar detalles del pedido');
    }
}

/**
 * Mostrar modal con detalles del pedido
 */
function showOrderModal(order) {
    const modal = document.getElementById('order-modal');
    if (!modal) return;

    // Información del pedido
    document.getElementById('modal-order-number').textContent = order.transactionId;
    document.getElementById('modal-order-date').textContent = new Date(order.createdAt).toLocaleString('es-AR');
    document.getElementById('modal-order-status').innerHTML = `<span class="status-badge ${order.status}">${getStatusText(order.status)}</span>`;
    document.getElementById('modal-order-total').textContent = `$${order.amount.toFixed(2)}`;

    // Productos
    const itemsList = document.getElementById('modal-items');
    if (itemsList) {
        itemsList.innerHTML = order.items.map(item => `
            <li>
                <strong>${item.title}</strong><br>
                Cantidad: ${item.quantity} × $${item.unit_price.toFixed(2)} = <strong>$${item.subtotal.toFixed(2)}</strong>
                ${item.description ? `<br><small>${item.description}</small>` : ''}
            </li>
        `).join('');
    }

    // Mostrar modal
    modal.style.display = 'block';
}

/**
 * Cerrar modal
 */
window.closeModal = function () {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentOrder = null;
}

// Cerrar modal al hacer clic fuera
window.onclick = function (event) {
    const modal = document.getElementById('order-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
