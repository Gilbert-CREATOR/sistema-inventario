// Sistema de Dashboard
class DashboardSystem {
    constructor() {
        this.user = null;
        this.stats = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.loadDashboardData();
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

        // Navegación móvil
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
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
                this.updateUI();
                this.setupRoleBasedUI();
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
        const userWelcomeName = document.getElementById('user-welcome-name');
        const userRoleDisplay = document.getElementById('user-role-display');

        if (userNameDisplay) {
            userNameDisplay.textContent = this.user.name || this.user.username;
        }

        if (userWelcomeName) {
            userWelcomeName.textContent = this.user.name || this.user.username;
        }

        if (userRoleDisplay) {
            const roleNames = {
                'superadmin': 'Super Administrador',
                'admin': 'Administrador',
                'employee': 'Empleado',
                'customer': 'Cliente'
            };
            userRoleDisplay.textContent = roleNames[this.user.role] || this.user.role;
        }

        // Actualizar fecha actual
        this.updateCurrentDate();
    }

    setupRoleBasedUI() {
        // Mostrar/ocultar elementos según el rol
        const role = this.user.role;

        // Catálogo (visible para todos)
        const catalogNavItem = document.getElementById('catalog-nav-item');
        if (catalogNavItem) {
            catalogNavItem.style.display = 'block';
        }

        // Clientes (admin, employee, superadmin)
        const customersNavItem = document.getElementById('customers-nav-item');
        if (customersNavItem) {
            customersNavItem.style.display = ['admin', 'employee', 'superadmin'].includes(role) ? 'block' : 'none';
        }

        // Inventario (admin, employee, superadmin)
        const inventoryNavItem = document.getElementById('inventory-nav-item');
        if (inventoryNavItem) {
            inventoryNavItem.style.display = ['admin', 'employee', 'superadmin'].includes(role) ? 'block' : 'none';
        }

        // Administración (admin, superadmin)
        const adminNavItem = document.getElementById('admin-nav-item');
        if (adminNavItem) {
            adminNavItem.style.display = ['admin', 'superadmin'].includes(role) ? 'block' : 'none';
        }

        // Cargar acciones según rol
        this.loadRoleBasedActions();
    }

    loadRoleBasedActions() {
        const actionsGrid = document.getElementById('actions-grid');
        if (!actionsGrid) return;

        const role = this.user.role;
        let actions = [];

        // Acciones base para todos
        actions.push({
            icon: 'fas fa-user',
            title: 'Mi Perfil',
            description: 'Ver y editar mi información',
            action: () => this.openProfileModal()
        });

        // Acciones según rol
        if (role === 'customer') {
            actions.push(
                {
                    icon: 'fas fa-shopping-bag',
                    title: 'Ver Catálogo',
                    description: 'Explorar productos disponibles',
                    action: () => window.location.href = '/catalog'
                },
                {
                    icon: 'fas fa-shopping-cart',
                    title: 'Mis Pedidos',
                    description: 'Historial de compras',
                    action: () => this.showOrders()
                }
            );
        }

        if (['employee', 'admin', 'superadmin'].includes(role)) {
            actions.push(
                {
                    icon: 'fas fa-users',
                    title: 'Gestionar Clientes',
                    description: 'Ver y editar clientes',
                    action: () => window.location.href = '/customers'
                },
                {
                    icon: 'fas fa-box',
                    title: 'Gestionar Inventario',
                    description: 'Control de productos y stock',
                    action: () => window.location.href = '/inventory'
                }
            );
        }

        if (['admin', 'superadmin'].includes(role)) {
            actions.push(
                {
                    icon: 'fas fa-cog',
                    title: 'Administración',
                    description: 'Configuración del sistema',
                    action: () => window.location.href = '/admin'
                },
                {
                    icon: 'fas fa-chart-bar',
                    title: 'Reportes',
                    description: 'Ver estadísticas y reportes',
                    action: () => this.showReports()
                }
            );
        }

        if (role === 'superadmin') {
            actions.push(
                {
                    icon: 'fas fa-shield-alt',
                    title: 'Seguridad',
                    description: 'Gestión de seguridad',
                    action: () => this.showSecurityPanel()
                }
            );
        }

        // Renderizar acciones
        actionsGrid.innerHTML = actions.map(action => `
            <div class="action-card" onclick="${typeof action.action === 'function' ? action.action.toString().replace(/"/g, '&quot;') : action.action}">
                <div class="action-icon">
                    <i class="${action.icon}"></i>
                </div>
                <h3>${action.title}</h3>
                <p>${action.description}</p>
            </div>
        `).join('');
    }

    async loadDashboardData() {
        try {
            // Cargar estadísticas según rol
            await this.loadStats();
            await this.loadRecentActivity();
            
            // Mostrar reportes solo para admin y superadmin
            if (['admin', 'superadmin'].includes(this.user.role)) {
                document.getElementById('dashboard-reports').style.display = 'block';
            }
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
        }
    }

    async loadStats() {
        try {
            let stats = {};

            if (this.user.role === 'customer') {
                // Estadísticas de cliente
                stats = await this.loadCustomerStats();
            } else if (['employee', 'admin', 'superadmin'].includes(this.user.role)) {
                // Estadísticas de negocio
                stats = await this.loadBusinessStats();
            }

            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    async loadCustomerStats() {
        // Simulación de estadísticas de cliente
        return {
            totalOrders: Math.floor(Math.random() * 50) + 10,
            pendingOrders: Math.floor(Math.random() * 5),
            favoriteProducts: Math.floor(Math.random() * 20) + 5,
            totalSpent: Math.floor(Math.random() * 10000) + 1000
        };
    }

    async loadBusinessStats() {
        try {
            // Cargar estadísticas reales del negocio
            const [customersResponse, inventoryResponse] = await Promise.all([
                window.authSystem.authenticatedFetch('/api/customers'),
                window.authSystem.authenticatedFetch('/api/inventory/items')
            ]);

            const customers = customersResponse.ok ? await customersResponse.json() : [];
            const inventory = inventoryResponse.ok ? await inventoryResponse.json() : [];

            const totalProducts = inventory.length;
            const totalClients = customers.length;
            const lowStockItems = inventory.filter(item => item.stock <= (item.minStock || 5)).length;
            const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.stock), 0);

            return {
                totalProducts,
                totalClients,
                lowStockItems,
                totalValue
            };
        } catch (error) {
            console.error('Error cargando estadísticas de negocio:', error);
            // Valores por defecto
            return {
                totalProducts: 0,
                totalClients: 0,
                lowStockItems: 0,
                totalValue: 0
            };
        }
    }

    updateStatsDisplay(stats) {
        // Actualizar según el rol
        if (this.user.role === 'customer') {
            document.getElementById('total-products').textContent = stats.totalOrders || 0;
            document.getElementById('total-clients').textContent = stats.favoriteProducts || 0;
            document.getElementById('low-stock-items').textContent = stats.pendingOrders || 0;
            document.getElementById('total-value').textContent = this.formatCurrency(stats.totalSpent || 0);
        } else {
            document.getElementById('total-products').textContent = stats.totalProducts || 0;
            document.getElementById('total-clients').textContent = stats.totalClients || 0;
            document.getElementById('low-stock-items').textContent = stats.lowStockItems || 0;
            document.getElementById('total-value').textContent = this.formatCurrency(stats.totalValue || 0);
        }
    }

    async loadRecentActivity() {
        try {
            const activityList = document.getElementById('activity-list');
            if (!activityList) return;

            // Simulación de actividad reciente
            const activities = this.generateMockActivity();
            
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">${activity.text}</p>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando actividad reciente:', error);
        }
    }

    generateMockActivity() {
        const activities = [];
        
        if (this.user.role === 'customer') {
            activities.push(
                { icon: 'fas fa-shopping-cart', text: 'Realizaste una compra', time: 'Hace 2 horas' },
                { icon: 'fas fa-heart', text: 'Agregaste un producto a favoritos', time: 'Ayer' },
                { icon: 'fas fa-user', text: 'Actualizaste tu perfil', time: 'Hace 3 días' }
            );
        } else if (['employee', 'admin', 'superadmin'].includes(this.user.role)) {
            activities.push(
                { icon: 'fas fa-user-plus', text: 'Nuevo cliente registrado', time: 'Hace 1 hora' },
                { icon: 'fas fa-box', text: 'Producto agregado al inventario', time: 'Hace 3 horas' },
                { icon: 'fas fa-edit', text: 'Stock actualizado', time: 'Ayer' },
                { icon: 'fas fa-dollar-sign', text: 'Crédito de cliente modificado', time: 'Hace 2 días' }
            );
        }

        return activities;
    }

    updateCurrentDate() {
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            currentDateElement.textContent = new Date().toLocaleDateString('es-MX', options);
        }
    }

    openProfileModal() {
        // Implementar modal de perfil
        window.authSystem.showInfo('Función de perfil en desarrollo');
    }

    openSettingsModal() {
        // Implementar modal de configuración
        window.authSystem.showInfo('Función de configuración en desarrollo');
    }

    showOrders() {
        window.authSystem.showInfo('Historial de pedidos en desarrollo');
    }

    showReports() {
        window.authSystem.showInfo('Reportes y estadísticas en desarrollo');
    }

    showSecurityPanel() {
        window.authSystem.showInfo('Panel de seguridad en desarrollo');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }
}

// Instancia global
window.dashboardSystem = new DashboardSystem();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // La instancia ya se inicializó en el constructor
});
