// Sistema de Empleado
class EmployeeSystem {
    constructor() {
        this.user = null;
        this.tasks = [];
        this.alerts = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.loadEmployeeData();
        this.startClock();
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            window.authSystem.logout();
        });

        // Profile y settings
        document.getElementById('profile-btn')?.addEventListener('click', () => {
            this.openProfileModal();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.openSettingsModal();
        });

        // Modal de venta rápida
        const quickSaleModal = document.getElementById('quick-sale-modal');
        const closeQuickSale = document.getElementById('close-quick-sale');
        const cancelQuickSale = document.getElementById('cancel-quick-sale');
        const quickSaleForm = document.getElementById('quick-sale-form');

        if (closeQuickSale) closeQuickSale.addEventListener('click', () => this.closeQuickSaleModal());
        if (cancelQuickSale) cancelQuickSale.addEventListener('click', () => this.closeQuickSaleModal());
        if (quickSaleForm) quickSaleForm.addEventListener('submit', (e) => this.handleQuickSale(e));

        // Modal de ajuste de stock
        const stockModal = document.getElementById('stock-adjustment-modal');
        const closeStockModal = document.getElementById('close-stock-adjustment');
        const cancelStockModal = document.getElementById('cancel-stock-adjustment');
        const stockForm = document.getElementById('stock-adjustment-form');

        if (closeStockModal) closeStockModal.addEventListener('click', () => this.closeStockModal());
        if (cancelStockModal) cancelStockModal.addEventListener('click', () => this.closeStockModal());
        if (stockForm) stockForm.addEventListener('submit', (e) => this.handleStockAdjustment(e));

        // Cargar datos en selects
        document.getElementById('sale-product')?.addEventListener('change', (e) => this.updateSalePrice(e.target.value));
        document.getElementById('sale-quantity')?.addEventListener('input', () => this.calculateSaleTotal());

        // Cerrar modales al hacer clic fuera
        [quickSaleModal, stockModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
    }

    async checkAuthStatus() {
        try {
            if (!window.authSystem.token) {
                window.location.href = '/login';
                return;
            }

            const response = await window.authSystem.authenticatedFetch('/api/auth/verify');
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                
                // Verificar que sea employee, admin o superadmin
                if (!['employee', 'admin', 'superadmin'].includes(this.user.role)) {
                    window.location.href = '/dashboard';
                    return;
                }

                this.updateUI();
            } else {
                window.authSystem.logout();
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.authSystem.logout();
        }
    }

    updateUI() {
        // Actualizar información del usuario
        const userNameDisplay = document.getElementById('user-name-display');
        const employeeName = document.getElementById('employee-name');

        if (userNameDisplay) {
            userNameDisplay.textContent = this.user.name || this.user.username;
        }

        if (employeeName) {
            employeeName.textContent = this.user.name || this.user.username;
        }
    }

    async loadEmployeeData() {
        try {
            await Promise.all([
                this.loadDailyStats(),
                this.loadTasks(),
                this.loadAlerts(),
                this.loadActivity(),
                this.loadQuickSaleData(),
                this.loadStockAdjustmentData()
            ]);
        } catch (error) {
            console.error('Error cargando datos de empleado:', error);
        }
    }

    async loadDailyStats() {
        try {
            // Simulación de estadísticas diarias
            const stats = {
                dailySales: Math.floor(Math.random() * 50) + 10,
                newCustomers: Math.floor(Math.random() * 10) + 1,
                productsSold: Math.floor(Math.random() * 100) + 20,
                dailyRevenue: Math.floor(Math.random() * 50000) + 10000
            };

            document.getElementById('daily-sales').textContent = stats.dailySales;
            document.getElementById('new-customers').textContent = stats.newCustomers;
            document.getElementById('products-sold').textContent = stats.productsSold;
            document.getElementById('daily-revenue').textContent = this.formatCurrency(stats.dailyRevenue);
        } catch (error) {
            console.error('Error cargando estadísticas diarias:', error);
        }
    }

    async loadTasks() {
        try {
            // Simulación de tareas pendientes
            const tasksList = document.getElementById('tasks-list');
            if (!tasksList) return;

            const tasks = [
                {
                    id: 1,
                    title: 'Revisar stock bajo',
                    description: '5 productos necesitan reabastecimiento urgente',
                    priority: 'urgent',
                    time: 'Hace 2 horas',
                    action: 'Revisar'
                },
                {
                    id: 2,
                    title: 'Contactar clientes',
                    description: 'Seguimiento a 3 clientes con crédito pendiente',
                    priority: 'normal',
                    time: 'Hoy',
                    action: 'Contactar'
                },
                {
                    id: 3,
                    title: 'Actualizar inventario',
                    description: 'Registrar nuevas entradas de productos',
                    priority: 'low',
                    time: 'Mañana',
                    action: 'Actualizar'
                }
            ];

            tasksList.innerHTML = tasks.map(task => `
                <div class="task-item ${task.priority}">
                    <div class="task-icon">
                        <i class="fas ${this.getTaskIcon(task.priority)}"></i>
                    </div>
                    <div class="task-content">
                        <h4 class="task-title">${task.title}</h4>
                        <p class="task-description">${task.description}</p>
                        <div class="task-meta">
                            <span class="task-priority ${task.priority}">${this.getPriorityName(task.priority)}</span>
                            <span class="task-time">${task.time}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm ${this.getPriorityButtonClass(task.priority)}">${task.action}</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando tareas:', error);
        }
    }

    getTaskIcon(priority) {
        const icons = {
            urgent: 'fa-exclamation-triangle',
            normal: 'fa-phone',
            low: 'fa-clipboard-check'
        };
        return icons[priority] || 'fa-tasks';
    }

    getPriorityName(priority) {
        const names = {
            urgent: 'Urgente',
            normal: 'Normal',
            low: 'Baja'
        };
        return names[priority] || priority;
    }

    getPriorityButtonClass(priority) {
        const classes = {
            urgent: 'btn-primary',
            normal: 'btn-secondary',
            low: 'btn-outline'
        };
        return classes[priority] || 'btn-secondary';
    }

    async loadAlerts() {
        try {
            // Cargar productos con stock bajo
            const response = await window.authSystem.authenticatedFetch('/api/inventory/items');
            if (response.ok) {
                const inventory = await response.json();
                const lowStockItems = inventory.filter(item => item.stock <= (item.minStock || 5));
                
                this.renderAlerts(lowStockItems);
            }
        } catch (error) {
            console.error('Error cargando alertas:', error);
        }
    }

    renderAlerts(items) {
        const alertsGrid = document.getElementById('low-stock-alerts');
        if (!alertsGrid) return;

        if (items.length === 0) {
            alertsGrid.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle"></i>
                    <p>No hay alertas de inventario</p>
                </div>
            `;
            return;
        }

        alertsGrid.innerHTML = items.map(item => `
            <div class="alert-card ${item.stock === 0 ? 'critical' : 'warning'}">
                <div class="alert-icon">
                    <i class="fas ${item.stock === 0 ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
                </div>
                <div class="alert-content">
                    <h4>${item.name}</h4>
                    <p>Stock actual: ${item.stock} unidades</p>
                    <p>Stock mínimo: ${item.minStock || 5} unidades</p>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.location.href='/inventory'">
                        <i class="fas fa-edit"></i>
                        Ajustar
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadActivity() {
        try {
            const timeline = document.getElementById('activity-timeline');
            if (!timeline) return;

            // Simulación de actividad reciente
            const activities = [
                {
                    icon: 'fa-plus',
                    title: 'Cliente agregado',
                    description: 'Registraste un nuevo cliente: Juan Pérez',
                    time: 'Hace 30 minutos'
                },
                {
                    icon: 'fa-edit',
                    title: 'Stock actualizado',
                    description: 'Ajustaste el stock del producto "Laptop Dell"',
                    time: 'Hace 2 horas'
                },
                {
                    icon: 'fa-dollar-sign',
                    title: 'Crédito actualizado',
                    description: 'Modificaste el crédito del cliente María García',
                    time: 'Ayer'
                }
            ];

            timeline.innerHTML = activities.map(activity => `
                <div class="timeline-item">
                    <div class="timeline-marker">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <h4>${activity.title}</h4>
                        <p>${activity.description}</p>
                        <span class="timeline-time">${activity.time}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando actividad:', error);
        }
    }

    async loadQuickSaleData() {
        try {
            // Cargar clientes y productos para venta rápida
            const [customersResponse, inventoryResponse] = await Promise.all([
                window.authSystem.authenticatedFetch('/api/customers'),
                window.authSystem.authenticatedFetch('/api/inventory/items')
            ]);

            const customerSelect = document.getElementById('sale-customer');
            const productSelect = document.getElementById('sale-product');

            if (customersResponse.ok && customerSelect) {
                const customers = await customersResponse.json();
                customerSelect.innerHTML = '<option value="">Seleccionar cliente</option>' +
                    customers.map(customer => `
                        <option value="${customer.id}">${customer.name} (${customer.email})</option>
                    `).join('');
            }

            if (inventoryResponse.ok && productSelect) {
                const inventory = await inventoryResponse.json();
                const availableProducts = inventory.filter(item => item.stock > 0);
                productSelect.innerHTML = '<option value="">Seleccionar producto</option>' +
                    availableProducts.map(product => `
                        <option value="${product.id}" data-price="${product.price}" data-stock="${product.stock}">
                            ${product.name} - $${product.price} (${product.stock} disponibles)
                        </option>
                    `).join('');
            }
        } catch (error) {
            console.error('Error cargando datos para venta rápida:', error);
        }
    }

    async loadStockAdjustmentData() {
        try {
            const response = await window.authSystem.authenticatedFetch('/api/inventory/items');
            if (response.ok) {
                const inventory = await response.json();
                const productSelect = document.getElementById('adjust-product');

                if (productSelect) {
                    productSelect.innerHTML = '<option value="">Seleccionar producto</option>' +
                        inventory.map(product => `
                            <option value="${product.id}">
                                ${product.name} - Stock actual: ${product.stock}
                            </option>
                        `).join('');
                }
            }
        } catch (error) {
            console.error('Error cargando datos para ajuste de stock:', error);
        }
    }

    updateSalePrice(productId) {
        const productSelect = document.getElementById('sale-product');
        const priceInput = document.getElementById('sale-price');
        const quantityInput = document.getElementById('sale-quantity');

        if (!productId || !priceInput) return;

        const selectedOption = productSelect.querySelector(`option[value="${productId}"]`);
        const price = parseFloat(selectedOption?.dataset.price) || 0;
        const stock = parseInt(selectedOption?.dataset.stock) || 0;

        priceInput.value = price;
        quantityInput.max = stock;
        quantityInput.value = Math.min(1, stock);

        this.calculateSaleTotal();
    }

    calculateSaleTotal() {
        const quantity = parseInt(document.getElementById('sale-quantity')?.value) || 0;
        const price = parseFloat(document.getElementById('sale-price')?.value) || 0;
        const totalInput = document.getElementById('sale-total');

        if (totalInput) {
            totalInput.value = (quantity * price).toFixed(2);
        }
    }

    async handleQuickSale(e) {
        e.preventDefault();

        const customerId = document.getElementById('sale-customer').value;
        const productId = document.getElementById('sale-product').value;
        const quantity = parseInt(document.getElementById('sale-quantity').value);
        const price = parseFloat(document.getElementById('sale-price').value);

        if (!customerId || !productId || quantity <= 0) {
            window.authSystem.showError('Por favor completa todos los campos');
            return;
        }

        try {
            // Aquí iría la lógica para registrar la venta
            // Por ahora solo mostramos un mensaje de éxito
            window.authSystem.showSuccess('Venta registrada exitosamente');
            this.closeQuickSaleModal();
            e.target.reset();
        } catch (error) {
            console.error('Error registrando venta:', error);
            window.authSystem.showError('Error al registrar la venta');
        }
    }

    async handleStockAdjustment(e) {
        e.preventDefault();

        const productId = document.getElementById('adjust-product').value;
        const quantity = parseInt(document.getElementById('adjust-quantity').value);
        const reason = document.getElementById('adjust-reason').value;

        if (!productId || !quantity || !reason) {
            window.authSystem.showError('Por favor completa todos los campos');
            return;
        }

        try {
            const response = await window.authSystem.authenticatedFetch(`/api/inventory/items/${productId}/stock`, {
                method: 'PATCH',
                body: JSON.stringify({
                    adjustment: quantity,
                    reason: reason
                })
            });

            if (response.ok) {
                window.authSystem.showSuccess('Stock ajustado exitosamente');
                this.closeStockModal();
                e.target.reset();
                await this.loadAlerts();
            } else {
                const error = await response.json();
                window.authSystem.showError(error.message || 'Error al ajustar stock');
            }
        } catch (error) {
            console.error('Error ajustando stock:', error);
            window.authSystem.showError('Error de conexión');
        }
    }

    startClock() {
        const updateTime = () => {
            const timeElement = document.getElementById('current-time');
            if (timeElement) {
                timeElement.textContent = new Date().toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    // Funciones globales para modales
    openQuickSale() {
        document.getElementById('quick-sale-modal')?.classList.add('active');
    }

    openStockAdjustment() {
        document.getElementById('stock-adjustment-modal')?.classList.add('active');
    }

    closeQuickSaleModal() {
        document.getElementById('quick-sale-modal')?.classList.remove('active');
    }

    closeStockModal() {
        document.getElementById('stock-adjustment-modal')?.classList.remove('active');
    }

    openProfileModal() {
        window.authSystem.showInfo('Perfil de empleado en desarrollo');
    }

    openSettingsModal() {
        window.authSystem.showInfo('Configuración en desarrollo');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }
}

// Instancia global
window.employeeSystem = new EmployeeSystem();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // La instancia ya se inicializó en el constructor
});
