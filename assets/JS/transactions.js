/**
 * TRANSACTIONS MANAGEMENT
 * 
 * Módulo para gestionar transacciones en el panel de administración
 * Incluye listado, filtros, estadísticas y actualización de estados
 */

const API_URL = 'http://localhost:3000/api';

// Variable global para almacenar la transacción actual en el modal
let currentTransaction = null;

/**
 * Inicializar la página de transacciones
 */
async function init() {
    console.log('Initializing transactions page...');

    // Verificar autenticación y permisos de admin
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión como administrador para acceder a esta página');
        window.location.href = './login.html';
        return;
    }

    // Cargar estadísticas y transacciones
    await loadStats();
    await loadTransactions();

    // Setup event listeners para filtros
    setupFilterListeners();
}

/**
 * Configurar listeners para los filtros
 */
function setupFilterListeners() {
    const filterStatus = document.getElementById('filter-status');
    const filterSearch = document.getElementById('filter-search');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');

    // Aplicar filtros al presionar Enter en el campo de búsqueda
    if (filterSearch) {
        filterSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
}

/**
 * Cargar estadísticas y balance comercial
 */
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/transactions/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }

        const data = await response.json();

        if (data.success) {
            displayStats(data.stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // No mostrar error al usuario, solo en consola
    }
}

/**
 * Mostrar estadísticas en el dashboard
 */
function displayStats(stats) {
    // Total recaudado
    const totalAmount = document.getElementById('total-amount');
    if (totalAmount) {
        totalAmount.textContent = `$${stats.total.amount.toFixed(2)}`;
    }

    // Ventas aprobadas
    const approvedAmount = document.getElementById('approved-amount');
    const approvedCount = document.getElementById('approved-count');
    if (approvedAmount) {
        approvedAmount.textContent = `$${stats.approved.amount.toFixed(2)}`;
    }
    if (approvedCount) {
        approvedCount.textContent = `${stats.approved.transactions} transacciones`;
    }

    // Ventas pendientes
    const pendingAmount = document.getElementById('pending-amount');
    const pendingCount = document.getElementById('pending-count');
    if (pendingAmount) {
        pendingAmount.textContent = `$${stats.byStatus.pending.amount.toFixed(2)}`;
    }
    if (pendingCount) {
        pendingCount.textContent = `${stats.byStatus.pending.count} transacciones`;
    }

    // Ventas rechazadas
    const rejectedAmount = document.getElementById('rejected-amount');
    const rejectedCount = document.getElementById('rejected-count');
    if (rejectedAmount) {
        rejectedAmount.textContent = `$${stats.byStatus.rejected.amount.toFixed(2)}`;
    }
    if (rejectedCount) {
        rejectedCount.textContent = `${stats.byStatus.rejected.count} transacciones`;
    }
}

/**
 * Cargar transacciones con filtros opcionales
 */
async function loadTransactions(filters = {}) {
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    const table = document.getElementById('transactions-table');
    const tbody = document.getElementById('transactions-tbody');

    try {
        // Mostrar loading
        if (loading) loading.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        if (table) table.style.display = 'none';

        const token = localStorage.getItem('token');

        // Construir query string con filtros
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        queryParams.append('limit', '100');

        const response = await fetch(`${API_URL}/transactions?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                alert('No tienes permisos para acceder a esta página');
                window.location.href = './login.html';
                return;
            }
            throw new Error('Error al cargar transacciones');
        }

        const data = await response.json();

        // Ocultar loading
        if (loading) loading.style.display = 'none';

        if (data.success && data.transactions.length > 0) {
            displayTransactions(data.transactions);
            if (table) table.style.display = 'table';
        } else {
            if (emptyState) emptyState.style.display = 'block';
        }

    } catch (error) {
        console.error('Error loading transactions:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        if (loading) loading.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fa-solid fa-exclamation-triangle"></i>
                <h3>Error al cargar transacciones</h3>
                <p>${error.message}</p>
                <p style="font-size: 12px; color: #666;">Revisa la consola del navegador (F12) para más detalles</p>
            `;
        }
    }
}

/**
 * Mostrar transacciones en la tabla
 */
function displayTransactions(transactions) {
    const tbody = document.getElementById('transactions-tbody');
    if (!tbody) return;

    tbody.innerHTML = transactions.map(transaction => {
        const date = new Date(transaction.createdAt).toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const customerEmail = transaction.customerInfo?.email || 'N/A';
        const itemsCount = transaction.items?.length || 0;
        const itemsText = itemsCount === 1 ? '1 producto' : `${itemsCount} productos`;

        return `
            <tr>
                <td><code>${transaction.transactionId.substring(0, 12)}...</code></td>
                <td>${date}</td>
                <td>${customerEmail}</td>
                <td>${itemsText}</td>
                <td><strong>$${transaction.amount.toFixed(2)}</strong></td>
                <td><span class="status-badge ${transaction.status}">${getStatusText(transaction.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewTransaction('${transaction._id}')">
                            <i class="fa-solid fa-eye"></i> Ver
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Obtener texto en español para el estado
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
    const search = document.getElementById('filter-search')?.value;
    const startDate = document.getElementById('filter-start-date')?.value;
    const endDate = document.getElementById('filter-end-date')?.value;

    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    await loadTransactions(filters);

    // Recargar estadísticas con los mismos filtros de fecha
    if (startDate || endDate) {
        await loadStatsWithFilters({ startDate, endDate });
    } else {
        await loadStats();
    }
}

/**
 * Cargar estadísticas con filtros de fecha
 */
async function loadStatsWithFilters(filters) {
    try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);

        const response = await fetch(`${API_URL}/transactions/stats?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }

        const data = await response.json();

        if (data.success) {
            displayStats(data.stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Ver detalles de una transacción
 */
window.viewTransaction = async function (transactionId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar detalles de la transacción');
        }

        const data = await response.json();

        if (data.success) {
            currentTransaction = data.transaction;
            showTransactionModal(data.transaction);
        }
    } catch (error) {
        console.error('Error viewing transaction:', error);
        alert('Error al cargar detalles de la transacción');
    }
}

/**
 * Mostrar modal con detalles de la transacción
 */
function showTransactionModal(transaction) {
    const modal = document.getElementById('transaction-modal');
    if (!modal) return;

    // Información general
    document.getElementById('modal-transaction-id').textContent = transaction.transactionId;
    document.getElementById('modal-date').textContent = new Date(transaction.createdAt).toLocaleString('es-AR');
    document.getElementById('modal-status').innerHTML = `<span class="status-badge ${transaction.status}">${getStatusText(transaction.status)}</span>`;
    document.getElementById('modal-amount').textContent = `$${transaction.amount.toFixed(2)}`;
    document.getElementById('modal-payment-method').textContent = transaction.paymentMethod || 'N/A';

    // Información del cliente
    document.getElementById('modal-customer-email').textContent = transaction.customerInfo?.email || 'N/A';
    document.getElementById('modal-customer-name').textContent = transaction.customerInfo?.name || 'N/A';
    document.getElementById('modal-customer-phone').textContent = transaction.customerInfo?.phone || 'N/A';

    // Productos
    const itemsList = document.getElementById('modal-items');
    if (itemsList) {
        itemsList.innerHTML = transaction.items.map(item => `
            <li>
                <strong>${item.title}</strong><br>
                Cantidad: ${item.quantity} × $${item.unit_price.toFixed(2)} = <strong>$${item.subtotal.toFixed(2)}</strong>
                ${item.description ? `<br><small>${item.description}</small>` : ''}
            </li>
        `).join('');
    }

    // Estado actual en el selector
    const newStatusSelect = document.getElementById('new-status');
    if (newStatusSelect) {
        newStatusSelect.value = transaction.status;
    }

    // Notas administrativas
    const adminNotes = document.getElementById('admin-notes');
    if (adminNotes) {
        adminNotes.value = transaction.notes || '';
    }

    // Mostrar modal
    modal.style.display = 'block';
}

/**
 * Cerrar modal
 */
window.closeModal = function () {
    const modal = document.getElementById('transaction-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentTransaction = null;
}

/**
 * Actualizar estado de la transacción
 */
window.updateTransactionStatus = async function () {
    if (!currentTransaction) return;

    const newStatus = document.getElementById('new-status')?.value;
    const note = document.getElementById('status-note')?.value;

    if (!newStatus) {
        alert('Por favor selecciona un estado');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/transactions/${currentTransaction._id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                note: note
            })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar estado');
        }

        const data = await response.json();

        if (data.success) {
            alert('Estado actualizado correctamente');
            closeModal();
            await loadTransactions();
            await loadStats();
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error al actualizar estado: ' + error.message);
    }
}

/**
 * Actualizar notas de la transacción
 */
window.updateTransactionNotes = async function () {
    if (!currentTransaction) return;

    const notes = document.getElementById('admin-notes')?.value;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/transactions/${currentTransaction._id}/notes`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notes: notes
            })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar notas');
        }

        const data = await response.json();

        if (data.success) {
            alert('Notas actualizadas correctamente');
            currentTransaction.notes = notes;
        }
    } catch (error) {
        console.error('Error updating notes:', error);
        alert('Error al actualizar notas: ' + error.message);
    }
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function (event) {
    const modal = document.getElementById('transaction-modal');
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
