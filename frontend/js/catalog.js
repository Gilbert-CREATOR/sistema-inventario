// Sistema de Catálogo de Productos
class CatalogSystem {
    constructor() {
        this.products = [];
        this.categories = [];
        this.filters = {
            category: '',
            minPrice: null,
            maxPrice: null,
            search: '',
            sortBy: 'name',
            sortOrder: 'asc',
            page: 1,
            limit: 12
        };
        this.pagination = {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0
        };
        this.currentView = 'grid';
        this.apiBase = '/api/catalog';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCatalog();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('catalog-search');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 500);
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch(searchInput.value);
            });
        }

        // Filtros
        document.getElementById('apply-price-filter')?.addEventListener('click', () => {
            this.applyPriceFilter();
        });

        document.getElementById('clear-filters')?.addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('reset-search')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Ordenamiento
        const sortSelect = document.getElementById('sort-options');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.handleSort(e.target.value);
            });
        }

        // Vista
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeView(e.target.closest('.view-btn').dataset.view);
            });
        });

        // Modal de producto
        const modal = document.getElementById('product-modal');
        const closeBtn = document.getElementById('close-product-modal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeProductModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeProductModal();
                }
            });
        }

        // Autenticación
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            window.authSystem.logout();
        });
    }

    async loadCatalog() {
        try {
            this.showLoading(true);
            
            const queryParams = new URLSearchParams(this.filters);
            const response = await fetch(`${this.apiBase}?${queryParams}`);
            const data = await response.json();

            if (response.ok) {
                this.products = data.products;
                this.pagination = data.pagination;
                this.categories = data.filters.categories;
                
                this.renderProducts();
                this.renderFilters();
                this.renderPagination();
                this.updateResultsCount();
            } else {
                this.showError('Error al cargar el catálogo');
            }
        } catch (error) {
            console.error('Error cargando catálogo:', error);
            this.showError('Error de conexión');
        } finally {
            this.showLoading(false);
        }
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        const emptyState = document.getElementById('empty-state');

        if (!grid) return;

        if (this.products.length === 0) {
            grid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        grid.className = this.currentView === 'grid' ? 'products-grid' : 'products-list';
        
        grid.innerHTML = this.products.map(product => {
            if (this.currentView === 'grid') {
                return this.renderProductCard(product);
            } else {
                return this.renderProductListItem(product);
            }
        }).join('');

        // Agregar event listeners a los productos
        this.attachProductEventListeners();
    }

    renderProductCard(product) {
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0] 
            : 'https://picsum.photos/seed/product-' + product.id + '/300/200.jpg';

        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                    ${product.stock <= 5 ? '<span class="stock-badge low-stock">Stock Bajo</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <div class="product-rating">
                        ${this.renderStars(product.rating)}
                        <span class="rating-text">(${product.reviews})</span>
                    </div>
                    <div class="product-price">
                        <span class="price">${this.formatCurrency(product.price)}</span>
                        <span class="stock-info">${product.stock} disponibles</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-sm view-details" data-id="${product.id}">
                            <i class="fas fa-eye"></i>
                            Ver Detalles
                        </button>
                        ${window.authSystem.user ? `
                            <button class="btn btn-secondary btn-sm add-to-cart" data-id="${product.id}">
                                <i class="fas fa-cart-plus"></i>
                                Agregar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderProductListItem(product) {
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0] 
            : 'https://picsum.photos/seed/product-' + product.id + '/100/100.jpg';

        return `
            <div class="product-list-item" data-id="${product.id}">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-details">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <p class="product-description">${product.description || 'Sin descripción disponible'}</p>
                    <div class="product-meta">
                        <div class="product-rating">
                            ${this.renderStars(product.rating)}
                            <span class="rating-text">(${product.reviews})</span>
                        </div>
                        <span class="stock-info">${product.stock} disponibles</span>
                    </div>
                </div>
                <div class="product-pricing">
                    <div class="product-price">
                        <span class="price">${this.formatCurrency(product.price)}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-sm view-details" data-id="${product.id}">
                            <i class="fas fa-eye"></i>
                            Ver Detalles
                        </button>
                        ${window.authSystem.user ? `
                            <button class="btn btn-secondary btn-sm add-to-cart" data-id="${product.id}">
                                <i class="fas fa-cart-plus"></i>
                                Agregar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
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

    renderFilters() {
        const categoryFilters = document.getElementById('category-filters');
        if (!categoryFilters) return;

        categoryFilters.innerHTML = `
            <label class="filter-option">
                <input type="radio" name="category" value="" ${!this.filters.category ? 'checked' : ''}>
                <span class="filter-label">Todas</span>
            </label>
            ${this.categories.map(category => `
                <label class="filter-option">
                    <input type="radio" name="category" value="${category}" ${this.filters.category === category ? 'checked' : ''}>
                    <span class="filter-label">${category}</span>
                </label>
            `).join('')}
        `;

        // Agregar event listeners
        categoryFilters.querySelectorAll('input[name="category"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.filters.page = 1;
                this.loadCatalog();
            });
        });
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination || this.pagination.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        
        let paginationHTML = '';

        // Botón anterior
        if (this.pagination.page > 1) {
            paginationHTML += `
                <button class="pagination-btn" data-page="${this.pagination.page - 1}">
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;
        }

        // Páginas
        const startPage = Math.max(1, this.pagination.page - 2);
        const endPage = Math.min(this.pagination.totalPages, this.pagination.page + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.pagination.page ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        if (endPage < this.pagination.totalPages) {
            if (endPage < this.pagination.totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" data-page="${this.pagination.totalPages}">${this.pagination.totalPages}</button>`;
        }

        // Botón siguiente
        if (this.pagination.page < this.pagination.totalPages) {
            paginationHTML += `
                <button class="pagination-btn" data-page="${this.pagination.page + 1}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        pagination.innerHTML = paginationHTML;

        // Agregar event listeners
        pagination.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.closest('.pagination-btn').dataset.page);
                this.filters.page = page;
                this.loadCatalog();
            });
        });
    }

    attachProductEventListeners() {
        // Ver detalles
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.view-details').dataset.id;
                this.showProductDetails(productId);
            });
        });

        // Agregar al carrito
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.add-to-cart').dataset.id;
                this.addToCart(productId);
            });
        });
    }

    async showProductDetails(productId) {
        try {
            const response = await fetch(`${this.apiBase}/${productId}`);
            const product = await response.json();

            if (response.ok) {
                this.renderProductModal(product);
            } else {
                this.showError('Producto no encontrado');
            }
        } catch (error) {
            console.error('Error obteniendo detalles:', error);
            this.showError('Error al cargar detalles del producto');
        }
    }

    renderProductModal(product) {
        const modal = document.getElementById('product-modal');
        const modalBody = document.getElementById('product-modal-body');
        const modalTitle = document.getElementById('modal-product-title');

        if (!modal || !modalBody || !modalTitle) return;

        modalTitle.textContent = product.name;

        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0] 
            : 'https://picsum.photos/seed/product-' + product.id + '/400/300.jpg';

        modalBody.innerHTML = `
            <div class="product-modal-content">
                <div class="product-modal-image">
                    <img src="${imageUrl}" alt="${product.name}">
                    ${product.stock <= 5 ? '<span class="stock-badge low-stock">Stock Bajo</span>' : ''}
                </div>
                <div class="product-modal-info">
                    <div class="product-modal-header">
                        <h3>${product.name}</h3>
                        <div class="product-modal-rating">
                            ${this.renderStars(product.rating)}
                            <span class="rating-text">(${product.reviews} reseñas)</span>
                        </div>
                    </div>
                    
                    <div class="product-modal-price">
                        <span class="price">${this.formatCurrency(product.price)}</span>
                        <span class="stock-info">${product.stock} unidades disponibles</span>
                    </div>

                    <div class="product-modal-description">
                        <h4>Descripción</h4>
                        <p>${product.description || 'Sin descripción disponible'}</p>
                    </div>

                    ${product.features && product.features.length > 0 ? `
                        <div class="product-modal-features">
                            <h4>Características</h4>
                            <ul>
                                ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${product.specifications && Object.keys(product.specifications).length > 0 ? `
                        <div class="product-modal-specs">
                            <h4>Especificaciones</h4>
                            <div class="specs-grid">
                                ${Object.entries(product.specifications).map(([key, value]) => `
                                    <div class="spec-item">
                                        <span class="spec-label">${key}:</span>
                                        <span class="spec-value">${value}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="product-modal-actions">
                        ${window.authSystem.user ? `
                            <button class="btn btn-primary" onclick="catalogSystem.addToCart(${product.id})">
                                <i class="fas fa-cart-plus"></i>
                                Agregar al Carrito
                            </button>
                        ` : `
                            <div class="login-prompt">
                                <p>Debes <a href="/login">iniciar sesión</a> para agregar productos al carrito</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    closeProductModal() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async addToCart(productId) {
        if (!window.authSystem.user) {
            window.authSystem.showError('Debes iniciar sesión para agregar productos al carrito');
            return;
        }

        try {
            // Aquí iría la lógica para agregar al carrito
            // Por ahora solo mostramos un mensaje de éxito
            window.authSystem.showSuccess('Producto agregado al carrito');
        } catch (error) {
            console.error('Error agregando al carrito:', error);
            window.authSystem.showError('Error al agregar al carrito');
        }
    }

    handleSearch(query) {
        this.filters.search = query;
        this.filters.page = 1;
        this.loadCatalog();
    }

    applyPriceFilter() {
        const minPrice = document.getElementById('min-price').value;
        const maxPrice = document.getElementById('max-price').value;

        this.filters.minPrice = minPrice ? parseFloat(minPrice) : null;
        this.filters.maxPrice = maxPrice ? parseFloat(maxPrice) : null;
        this.filters.page = 1;

        this.loadCatalog();
    }

    clearFilters() {
        this.filters = {
            category: '',
            minPrice: null,
            maxPrice: null,
            search: '',
            sortBy: 'name',
            sortOrder: 'asc',
            page: 1,
            limit: 12
        };

        // Limpiar inputs
        document.getElementById('catalog-search').value = '';
        document.getElementById('min-price').value = '';
        document.getElementById('max-price').value = '';
        document.getElementById('sort-options').value = 'name';

        this.loadCatalog();
    }

    handleSort(sortValue) {
        const [sortBy, sortOrder] = sortValue.split('-');
        this.filters.sortBy = sortBy;
        this.filters.sortOrder = sortOrder || 'asc';
        this.filters.page = 1;
        this.loadCatalog();
    }

    changeView(view) {
        this.currentView = view;
        
        // Actualizar botones
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.renderProducts();
    }

    updateResultsCount() {
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = this.pagination.total;
        }
    }

    checkAuthStatus() {
        if (window.authSystem.user) {
            window.authSystem.updateUIForAuthenticated();
        } else {
            window.authSystem.updateUIForGuest();
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }

    showLoading(show) {
        const grid = document.getElementById('products-grid');
        if (grid) {
            if (show) {
                grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
            }
        }
    }

    showError(message) {
        window.authSystem.showError(message);
    }
}

// Instancia global
window.catalogSystem = new CatalogSystem();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // La instancia ya se inicializó en el constructor
});
