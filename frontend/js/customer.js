// Sistema de Cliente
class CustomerSystem {
    constructor() {
        this.user = null;
        this.cart = [];
        this.orders = [];
        this.favorites = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.loadCustomerData();
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

        // Navegación de pedidos
        document.getElementById('orders-nav')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showOrders();
        });

        document.getElementById('orders-nav-footer')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showOrders();
        });

        document.getElementById('profile-nav-footer')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openProfileModal();
        });

        // Ver todos los pedidos
        document.getElementById('view-all-orders')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showOrders();
        });

        // Modal de perfil
        const profileModal = document.getElementById('profile-modal');
        const closeProfile = document.getElementById('close-profile');
        const cancelProfile = document.getElementById('cancel-profile');
        const profileForm = document.getElementById('profile-form');

        if (closeProfile) closeProfile.addEventListener('click', () => this.closeProfileModal());
        if (cancelProfile) cancelProfile.addEventListener('click', () => this.closeProfileModal());
        if (profileForm) profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));

        // Modal de detalles del pedido
        const orderModal = document.getElementById('order-details-modal');
        const closeOrderDetails = document.getElementById('close-order-details');

        if (closeOrderDetails) closeOrderDetails.addEventListener('click', () => this.closeOrderDetailsModal());

        // Carrito
        document.getElementById('clear-cart')?.addEventListener('click', () => this.clearCart());
        document.getElementById('checkout')?.addEventListener('click', () => this.checkout());

        // Cerrar modales al hacer clic fuera
        [profileModal, orderModal].forEach(modal => {
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
                
                // Verificar que sea cliente o tenga permisos de cliente
                if (!['customer', 'employee', 'admin', 'superadmin'].includes(this.user.role)) {
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
        const customerWelcomeName = document.getElementById('customer-welcome-name');

        if (userNameDisplay) {
            userNameDisplay.textContent = this.user.name || this.user.username;
        }

        if (customerWelcomeName) {
            customerWelcomeName.textContent = this.user.name || this.user.username;
        }

        // Actualizar crédito si está disponible
        if (this.user.credit !== undefined) {
            const creditElement = document.getElementById('customer-credit');
            if (creditElement) {
                creditElement.textContent = this.formatCurrency(this.user.credit);
            }
        }
    }

    async loadCustomerData() {
        try {
            await Promise.all([
                this.loadCustomerStats(),
                this.loadRecentOrders(),
                this.loadRecommendedProducts(),
                this.loadActivity(),
                this.loadCart()
            ]);
        } catch (error) {
            console.error('Error cargando datos de cliente:', error);
        }
    }

    async loadCustomerStats() {
        try {
            // Simulación de estadísticas de cliente
            const stats = {
                totalOrders: Math.floor(Math.random() * 20) + 5,
                pendingOrders: Math.floor(Math.random() * 3),
                favoriteProducts: Math.floor(Math.random() * 15) + 3,
                totalSpent: Math.floor(Math.random() * 5000) + 500
            };

            document.getElementById('total-orders').textContent = stats.totalOrders;
            document.getElementById('pending-orders').textContent = stats.pendingOrders;
            document.getElementById('favorite-products').textContent = stats.favoriteProducts;
            document.getElementById('total-spent').textContent = this.formatCurrency(stats.totalSpent);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    async loadRecentOrders() {
        try {
            const ordersList = document.getElementById('recent-orders');
            const emptyState = document.getElementById('orders-empty-state');

            if (!ordersList) return;

            // Simulación de pedidos recientes
            const orders = [
                {
                    id: 'ORD-001',
                    date: '15 Enero 2024',
                    status: 'processing',
                    items: 3,
                    total: 1250.00
                },
                {
                    id: 'ORD-002',
                    date: '10 Enero 2024',
                    status: 'delivered',
                    items: 2,
                    total: 850.00
                },
                {
                    id: 'ORD-003',
                    date: '5 Enero 2024',
                    status: 'shipped',
                    items: 1,
                    total: 450.00
                }
            ];

            if (orders.length === 0) {
                ordersList.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
            } else {
                ordersList.style.display = 'block';
                if (emptyState) emptyState.style.display = 'none';

                ordersList.innerHTML = orders.map(order => `
                    <div class="order-item">
                        <div class="order-header">
                            <div class="order-info">
                                <span class="order-number">#${order.id}</span>
                                <span class="order-date">${order.date}</span>
                            </div>
                            <div class="order-status">
                                <span class="status-badge ${order.status}">${this.getStatusName(order.status)}</span>
                            </div>
                        </div>
                        <div class="order-content">
                            <div class="order-items">
                                <div class="order-item-preview">
                                    <img src="https://picsum.photos/seed/order${order.id}/50/50.jpg" alt="Producto">
                                    <span class="item-count">${order.items} productos</span>
                                </div>
                            </div>
                            <div class="order-total">
                                <span class="total-label">Total:</span>
                                <span class="total-amount">${this.formatCurrency(order.total)}</span>
                            </div>
                        </div>
                        <div class="order-actions">
                            <button class="btn btn-sm btn-outline" onclick="customerSystem.showOrderDetails('${order.id}')">
                                Ver Detalles
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="customerSystem.trackOrder('${order.id}')">
                                Seguir Pedido
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error cargando pedidos recientes:', error);
        }
    }

    getStatusName(status) {
        const names = {
            processing: 'En Proceso',
            shipped: 'Enviado',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
        };
        return names[status] || status;
    }

    async loadRecommendedProducts() {
        try {
            const response = await fetch('/api/catalog?limit=6');
            if (response.ok) {
                const data = await response.json();
                this.renderRecommendedProducts(data.products);
            }
        } catch (error) {
            console.error('Error cargando productos recomendados:', error);
        }
    }

    renderRecommendedProducts(products) {
        const grid = document.getElementById('recommended-products');
        if (!grid) return;

        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="https://picsum.photos/seed/product-${product.id}/300/200.jpg" alt="${product.name}">
                    ${product.stock <= 5 ? '<span class="stock-badge low-stock">Stock Bajo</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <div class="product-rating">
                        ${this.renderStars(4)}
                        <span class="rating-text">(12)</span>
                    </div>
                    <div class="product-price">
                        <span class="price">${this.formatCurrency(product.price)}</span>
                        <span class="stock-info">${product.stock} disponibles</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-sm" onclick="customerSystem.addToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i>
                            Agregar
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="customerSystem.addToFavorites(${product.id})">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    async loadActivity() {
        try {
            const timeline = document.getElementById('customer-activity-timeline');
            if (!timeline) return;

            // Simulación de actividad del cliente
            const activities = [
                {
                    icon: 'fa-user',
                    title: 'Cuenta creada',
                    description: 'Te registraste en nuestro sistema',
                    time: 'Hace 2 días'
                },
                {
                    icon: 'fa-heart',
                    title: 'Producto agregado a favoritos',
                    description: 'Agregaste "Laptop Dell" a tus favoritos',
                    time: 'Ayer'
                },
                {
                    icon: 'fa-shopping-cart',
                    title: 'Compra realizada',
                    description: 'Compraste 2 productos por $850.00',
                    time: 'Hace 3 días'
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

    async loadCart() {
        try {
            // Cargar carrito desde localStorage
            const savedCart = localStorage.getItem('cart');
            this.cart = savedCart ? JSON.parse(savedCart) : [];
            this.updateCartDisplay();
        } catch (error) {
            console.error('Error cargando carrito:', error);
            this.cart = [];
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        const cartActions = document.getElementById('cart-actions');

        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-icon">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <h3>Tu carrito está vacío</h3>
                    <p>Agrega productos desde el catálogo</p>
                    <a href="/catalog" class="btn btn-primary">
                        <i class="fas fa-shopping-bag"></i>
                        Ir al Catálogo
                    </a>
                </div>
            `;
            if (cartActions) cartActions.style.display = 'none';
        } else {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="https://picsum.photos/seed/cart-${item.id}/60/60.jpg" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>${this.formatCurrency(item.price)} x ${item.quantity}</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="btn btn-sm btn-outline" onclick="customerSystem.removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            if (cartCount) cartCount.textContent = this.cart.length;
            if (cartTotal) cartTotal.textContent = this.formatCurrency(total);
            if (cartActions) cartActions.style.display = 'flex';
        }
    }

    addToCart(productId) {
        // Aquí iría la lógica para agregar al carrito
        window.authSystem.showSuccess('Producto agregado al carrito');
        
        // Simulación de agregar al carrito
        this.cart.push({
            id: productId,
            name: 'Producto de ejemplo',
            price: 100,
            quantity: 1
        });
        
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartDisplay();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartDisplay();
        window.authSystem.showSuccess('Producto eliminado del carrito');
    }

    clearCart() {
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            this.cart = [];
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateCartDisplay();
            window.authSystem.showSuccess('Carrito vaciado');
        }
    }

    checkout() {
        if (this.cart.length === 0) {
            window.authSystem.showError('Tu carrito está vacío');
            return;
        }

        // Aquí iría la lógica de checkout
        window.authSystem.showInfo('Proceso de checkout en desarrollo');
    }

    addToFavorites(productId) {
        window.authSystem.showSuccess('Producto agregado a favoritos');
    }

    showOrders() {
        window.authSystem.showInfo('Historial completo de pedidos en desarrollo');
    }

    showOrderDetails(orderId) {
        const modal = document.getElementById('order-details-modal');
        const modalBody = document.getElementById('order-details-body');

        if (modal && modalBody) {
            // Simulación de detalles del pedido
            modalBody.innerHTML = `
                <div class="order-details">
                    <div class="order-header-details">
                        <h3>Pedido #${orderId}</h3>
                        <div class="order-meta">
                            <span class="order-date">15 Enero 2024</span>
                            <span class="order-status processing">En Proceso</span>
                        </div>
                    </div>
                    
                    <div class="order-items-details">
                        <h4>Productos</h4>
                        <div class="order-items-list">
                            <div class="order-item-detail">
                                <img src="https://picsum.photos/seed/item1/60/60.jpg" alt="Producto">
                                <div class="item-details">
                                    <h5>Laptop Dell XPS 13</h5>
                                    <p>Color: Negro | 16GB RAM | 512GB SSD</p>
                                    <span class="item-price">$1,200.00 x 1</span>
                                </div>
                            </div>
                            <div class="order-item-detail">
                                <img src="https://picsum.photos/seed/item2/60/60.jpg" alt="Producto">
                                <div class="item-details">
                                    <h5>Mouse Inalámbrico</h5>
                                    <p>Color: Negro | USB Recargable</p>
                                    <span class="item-price">$50.00 x 2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>$1,300.00</span>
                        </div>
                        <div class="summary-row">
                            <span>Envío:</span>
                            <span>$50.00</span>
                        </div>
                        <div class="summary-row">
                            <span>Impuestos:</span>
                            <span>$130.00</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span>$1,480.00</span>
                        </div>
                    </div>
                    
                    <div class="order-actions-details">
                        <button class="btn btn-secondary" onclick="customerSystem.closeOrderDetailsModal()">
                            Cerrar
                        </button>
                        <button class="btn btn-primary" onclick="customerSystem.trackOrder('${orderId}')">
                            Seguir Pedido
                        </button>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
        }
    }

    closeOrderDetailsModal() {
        document.getElementById('order-details-modal')?.classList.remove('active');
    }

    trackOrder(orderId) {
        window.authSystem.showInfo(`Seguimiento del pedido ${orderId} en desarrollo`);
    }

    async handleProfileSubmit(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('profile-fullname').value,
            email: document.getElementById('profile-email-input').value,
            phone: document.getElementById('profile-phone').value,
            address: document.getElementById('profile-address').value
        };

        const password = document.getElementById('profile-password').value;
        if (password) {
            formData.password = password;
        }

        try {
            const response = await window.authSystem.authenticatedFetch('/api/users/' + this.user.id, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                window.authSystem.showSuccess('Perfil actualizado exitosamente');
                this.closeProfileModal();
                // Actualizar información del usuario
                this.user = { ...this.user, ...formData };
                this.updateUI();
            } else {
                const error = await response.json();
                window.authSystem.showError(error.message || 'Error al actualizar perfil');
            }
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            window.authSystem.showError('Error de conexión');
        }
    }

    openProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (!modal) return;

        // Llenar datos del formulario
        document.getElementById('profile-name').textContent = this.user.name || this.user.username;
        document.getElementById('profile-email').textContent = this.user.email;
        document.getElementById('profile-role').textContent = this.getRoleDisplayName(this.user.role);
        document.getElementById('profile-fullname').value = this.user.name || '';
        document.getElementById('profile-email-input').value = this.user.email || '';
        document.getElementById('profile-phone').value = this.user.profile?.phone || '';
        document.getElementById('profile-address').value = this.user.profile?.address || '';

        modal.classList.add('active');
    }

    closeProfileModal() {
        document.getElementById('profile-modal')?.classList.remove('active');
    }

    openSettingsModal() {
        window.authSystem.showInfo('Configuración de cliente en desarrollo');
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'superadmin': 'Super Administrador',
            'admin': 'Administrador',
            'employee': 'Empleado',
            'customer': 'Cliente'
        };
        return roleNames[role] || role;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }
}

// Instancia global
window.customerSystem = new CustomerSystem();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // La instancia ya se inicializó en el constructor
});
