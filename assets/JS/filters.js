/**
 * FILTERS.JS
 * 
 * Maneja la lógica de filtrado de productos en las páginas de tienda.
 * Filtra por rango de precios y por categorías seleccionadas.
 */

export function initFilters() {
    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
    const productsContainer = document.querySelector('.productos-contenedor');

    if (!applyBtn || !productsContainer) return;

    // Aplicar filtros
    applyBtn.addEventListener('click', () => {
        const minPrice = parseFloat(minPriceInput.value) || 0;
        const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

        const selectedCategories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value.toLowerCase());

        const products = productsContainer.querySelectorAll('.producto');
        let visibleCount = 0;

        products.forEach(product => {
            const price = parseFloat(product.dataset.price);
            const category = (product.dataset.category || 'otros').toLowerCase();

            // Verificar precio
            const matchesPrice = price >= minPrice && price <= maxPrice;

            // Verificar categoría (si no hay seleccionadas, mostrar todas)
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);

            if (matchesPrice && matchesCategory) {
                product.style.display = 'block';
                visibleCount++;
            } else {
                product.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay resultados
        let noResultsMsg = document.getElementById('no-results-msg');
        if (visibleCount === 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('p');
                noResultsMsg.id = 'no-results-msg';
                noResultsMsg.style.textAlign = 'center';
                noResultsMsg.style.width = '100%';
                noResultsMsg.style.padding = '20px';
                noResultsMsg.style.color = '#666';
                noResultsMsg.textContent = 'No se encontraron productos con los filtros seleccionados.';
                productsContainer.appendChild(noResultsMsg);
            } else {
                noResultsMsg.style.display = 'block';
            }
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    });

    // Limpiar filtros
    clearBtn.addEventListener('click', () => {
        minPriceInput.value = '';
        maxPriceInput.value = '';
        categoryCheckboxes.forEach(cb => cb.checked = false);

        // Mostrar todos los productos
        const products = productsContainer.querySelectorAll('.producto');
        products.forEach(p => p.style.display = 'block');

        const noResultsMsg = document.getElementById('no-results-msg');
        if (noResultsMsg) noResultsMsg.style.display = 'none';
    });
}
