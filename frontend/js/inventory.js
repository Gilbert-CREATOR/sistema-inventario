// Funcionalidad específica para gestión de inventario
class InventoryManager {
    constructor() {
        this.system = window.inventorySystem;
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInventory();
        this.updateInventoryStats();
    }

    setupEventListeners() {
        // Botón agregar item
        const addBtn = document.getElementById('add-item-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openItemModal());
        }

        // Modal de item
        const itemModal = document.getElementById('item-modal');
        const closeModal = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const itemForm = document.getElementById('item-form');

        if (closeModal) closeModal.addEventListener('click', () => this.closeItemModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeItemModal());
        if (itemForm) itemForm.addEventListener('submit', (e) => this.handleItemSubmit(e));

        // Modal de stock
        const stockModal = document.getElementById('stock-modal');
        const closeStockModal = document.getElementById('close-stock-modal');
        const cancelStockBtn = document.getElementById('cancel-stock-btn');
        const stockForm = document.getElementById('stock-form');

        if (closeStockModal) closeStockModal.addEventListener('click', () => this.closeStockModal());
        if (cancelStockBtn) cancelStockBtn.addEventListener('click', () => this.closeStockModal());
        if (stockForm) stockForm.addEventListener('submit', (e) => this.handleStockSubmit(e));

        // Filtros
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.loadInventory();
            });
        });

        // Búsqueda
        const searchInput = document.getElementById('search-items');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Cerrar modales al hacer clic fuera
        [itemModal, stockModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
    }

    loadInventory() {
        const tbody = document.getElementById('inventory-tbody');
        const emptyState = document.getElementById('empty-state');
        const tableContainer = document.querySelector('.inventory-table-container');

        if (!tbody || !emptyState || !tableContainer) return;

        let items = this.system.items;

        // Aplicar filtros
        if (this.currentFilter === 'low-stock') {
            items = items.filter(item => item.stock <= (item.minStock || 5) && item.stock > 0);
        } else if (this.currentFilter === 'out-of-stock') {
            items = items.filter(item => item.stock === 0);
        }

        if (items.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            tableContainer.style.display = 'block';
            emptyState.style.display = 'none';
            this.renderInventory(items);
        }
    }

    renderInventory(items) {
        const tbody = document.getElementById('inventory-tbody');
        if (!tbody) return;

        tbody.innerHTML = items.map(item => {
            const status = this.getStockStatus(item.stock, item.minStock || 5);
            const totalValue = item.price * item.stock;

            return `
                <tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>
                        <div>
                            <strong>${item.name}</strong>
                            ${item.sku ? `<br><small style="color: var(--text-secondary)">SKU: ${item.sku}</small>` : ''}
                        </div>
                    </td>
                    <td>${item.category}</td>
                    <td>${item.stock}</td>
                    <td>${this.system.formatCurrency(item.price)}</td>
                    <td>${this.system.formatCurrency(totalValue)}</td>
                    <td>
                        <span class="status-badge ${status.class}">${status.text}</span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-sm btn-primary" onclick="inventoryManager.openStockModal(${item.id})" title="Ajustar Stock">
                                <i class="fas fa-boxes"></i>
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="inventoryManager.editItem(${item.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="inventoryManager.deleteItem(${item.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStockStatus(stock, minStock) {
        if (stock === 0) {
            return { class: 'out-of-stock', text: 'Sin Stock' };
        } else if (stock <= minStock) {
            return { class: 'low-stock', text: 'Stock Bajo' };
        } else {
            return { class: 'in-stock', text: 'En Stock' };
        }
    }

    updateInventoryStats() {
        const totalItems = document.getElementById('total-items');
        const lowStock = document.getElementById('low-stock');
        const totalValue = document.getElementById('total-value');

        if (totalItems) {
            totalItems.textContent = this.system.items.length;
        }

        if (lowStock) {
            const lowStockItems = this.system.items.filter(item => 
                item.stock <= (item.minStock || 5) && item.stock > 0
            );
            lowStock.textContent = lowStockItems.length;
        }

        if (totalValue) {
            const value = this.system.items.reduce((sum, item) => sum + (item.price * item.stock), 0);
            totalValue.textContent = this.system.formatCurrency(value);
        }
    }

    openItemModal(itemId = null) {
        const modal = document.getElementById('item-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('item-form');

        if (!modal || !modalTitle || !form) return;

        if (itemId) {
            const item = this.system.items.find(i => i.id === itemId);
            if (item) {
                modalTitle.textContent = 'Editar Producto';
                document.getElementById('item-name').value = item.name;
                document.getElementById('item-category').value = item.category;
                document.getElementById('item-stock').value = item.stock;
                document.getElementById('item-price').value = item.price;
                document.getElementById('item-min-stock').value = item.minStock || 5;
                document.getElementById('item-sku').value = item.sku || '';
                document.getElementById('item-description').value = item.description || '';
                this.system.currentEditId = itemId;
            }
        } else {
            modalTitle.textContent = 'Nuevo Producto';
            form.reset();
            document.getElementById('item-min-stock').value = 5;
            this.system.currentEditId = null;
        }

        modal.classList.add('active');
    }

    closeItemModal() {
        const modal = document.getElementById('item-modal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('item-form').reset();
            this.system.currentEditId = null;
        }
    }

    handleItemSubmit(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('item-name').value,
            category: document.getElementById('item-category').value,
            stock: parseInt(document.getElementById('item-stock').value),
            price: parseFloat(document.getElementById('item-price').value),
            minStock: parseInt(document.getElementById('item-min-stock').value) || 5,
            sku: document.getElementById('item-sku').value,
            description: document.getElementById('item-description').value
        };

        if (this.system.currentEditId) {
            const updated = this.system.updateItem(this.system.currentEditId, formData);
            if (updated) {
                this.system.showAlert('Producto actualizado exitosamente', 'success');
            }
        } else {
            this.system.addItem(formData);
            this.system.showAlert('Producto agregado exitosamente', 'success');
        }

        this.closeItemModal();
        this.loadInventory();
        this.updateInventoryStats();
        this.system.updateStats();
    }

    editItem(itemId) {
        this.openItemModal(itemId);
    }

    deleteItem(itemId) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            this.system.deleteItem(itemId);
            this.system.showAlert('Producto eliminado exitosamente', 'success');
            this.loadInventory();
            this.updateInventoryStats();
            this.system.updateStats();
        }
    }

    openStockModal(itemId) {
        const modal = document.getElementById('stock-modal');
        const item = this.system.items.find(i => i.id === itemId);

        if (!modal || !item) return;

        document.getElementById('stock-item-name').textContent = item.name;
        document.getElementById('current-stock').textContent = item.stock;
        document.getElementById('stock-amount').value = '';
        document.getElementById('stock-reason').value = '';
        document.getElementById('stock-form').dataset.itemId = itemId;

        modal.classList.add('active');
    }

    closeStockModal() {
        const modal = document.getElementById('stock-modal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('stock-form').reset();
        }
    }

    handleStockSubmit(e) {
        e.preventDefault();

        const itemId = parseInt(e.target.dataset.itemId);
        const adjustment = parseInt(document.getElementById('stock-amount').value);
        const reason = document.getElementById('stock-reason').value;

        if (isNaN(adjustment)) {
            this.system.showAlert('Por favor ingresa un ajuste válido', 'error');
            return;
        }

        const item = this.system.items.find(i => i.id === itemId);
        if (item && item.stock + adjustment < 0) {
            this.system.showAlert('No puedes tener stock negativo', 'error');
            return;
        }

        const updated = this.system.adjustStock(itemId, adjustment, reason);
        if (updated) {
            const action = adjustment > 0 ? 'agregado' : 'quitado';
            this.system.showAlert(
                `Stock ${action} exitosamente: ${Math.abs(adjustment)} unidades`,
                'success'
            );
            this.closeStockModal();
            this.loadInventory();
            this.updateInventoryStats();
            this.system.updateStats();
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.loadInventory();
            return;
        }

        const filtered = this.system.items.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase()) ||
            (item.sku && item.sku.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderInventory(filtered);
    }
}

// Función global para abrir el modal desde el empty state
function openItemModal() {
    if (window.inventoryManager) {
        window.inventoryManager.openItemModal();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryManager = new InventoryManager();
});
