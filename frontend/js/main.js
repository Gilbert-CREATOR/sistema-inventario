// Funcionalidad principal del sistema
class InventorySystem {
    constructor() {
        this.customers = [];
        this.items = [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.updateStats();
    }

    setupEventListeners() {
        // Navegación móvil
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Cerrar menú al hacer clic en enlace
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    loadData() {
        // Cargar datos desde localStorage
        const savedCustomers = localStorage.getItem('customers');
        const savedItems = localStorage.getItem('items');

        if (savedCustomers) {
            this.customers = JSON.parse(savedCustomers);
        }

        if (savedItems) {
            this.items = JSON.parse(savedItems);
        }
    }

    saveData() {
        // Guardar datos en localStorage
        localStorage.setItem('customers', JSON.stringify(this.customers));
        localStorage.setItem('items', JSON.stringify(this.items));
    }

    updateStats() {
        // Actualizar estadísticas en la página principal
        const totalProducts = document.getElementById('total-products');
        const totalCustomers = document.getElementById('total-customers');
        const totalOrders = document.getElementById('total-orders');
        const totalRevenue = document.getElementById('total-revenue');

        if (totalProducts) {
            totalProducts.textContent = this.items.length;
        }

        if (totalCustomers) {
            totalCustomers.textContent = this.customers.length;
        }

        if (totalOrders) {
            // Simulación de órdenes
            totalOrders.textContent = Math.floor(Math.random() * 100) + 50;
        }

        if (totalRevenue) {
            // Calcular valor total del inventario
            const totalValue = this.items.reduce((sum, item) => sum + (item.price * item.stock), 0);
            totalRevenue.textContent = `$${totalValue.toFixed(2)}`;
        }
    }

    // Métodos para clientes
    addCustomer(customer) {
        const newCustomer = {
            id: Date.now(),
            ...customer,
            createdAt: new Date().toISOString()
        };
        this.customers.push(newCustomer);
        this.saveData();
        this.updateStats();
        return newCustomer;
    }

    updateCustomer(id, customerData) {
        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.customers[index] = { ...this.customers[index], ...customerData };
            this.saveData();
            return this.customers[index];
        }
        return null;
    }

    deleteCustomer(id) {
        this.customers = this.customers.filter(c => c.id !== id);
        this.saveData();
        this.updateStats();
    }

    updateCustomerCredit(id, creditAmount) {
        const customer = this.customers.find(c => c.id === id);
        if (customer) {
            customer.credit += creditAmount;
            this.saveData();
            return customer;
        }
        return null;
    }

    // Métodos para inventario
    addItem(item) {
        const newItem = {
            id: Date.now(),
            ...item,
            createdAt: new Date().toISOString()
        };
        this.items.push(newItem);
        this.saveData();
        this.updateStats();
        return newItem;
    }

    updateItem(id, itemData) {
        const index = this.items.findIndex(i => i.id === id);
        if (index !== -1) {
            this.items[index] = { ...this.items[index], ...itemData };
            this.saveData();
            return this.items[index];
        }
        return null;
    }

    deleteItem(id) {
        this.items = this.items.filter(i => i.id !== id);
        this.saveData();
        this.updateStats();
    }

    adjustStock(id, adjustment, reason) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.stock += adjustment;
            item.lastStockAdjustment = {
                amount: adjustment,
                reason: reason,
                date: new Date().toISOString()
            };
            this.saveData();
            return item;
        }
        return null;
    }

    // Utilidades
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-MX');
    }

    showAlert(message, type = 'info') {
        // Crear alerta
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        // Colores según tipo
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        alert.style.background = colors[type] || colors.info;

        document.body.appendChild(alert);

        // Remover después de 3 segundos
        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }
}

// Instancia global del sistema
window.inventorySystem = new InventorySystem();

// Animaciones CSS adicionales
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .alert {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
`;
document.head.appendChild(style);

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventorySystem;
}
