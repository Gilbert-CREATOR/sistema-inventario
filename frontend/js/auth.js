// Sistema de Autenticación
class AuthSystem {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.apiBase = '/api/auth';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Mostrar/ocultar contraseña
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const inputId = btn.getAttribute('onclick').match(/togglePassword\('?(.*?)'?\)/)?.[1] || 'password';
                this.togglePassword(inputId);
            });
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loginData = {
            usernameOrEmail: formData.get('usernameOrEmail'),
            password: formData.get('password')
        };

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuthData(data.token, data.user);
                
                // Redirigir según el rol
                this.redirectByRole(data.user.role);
            } else {
                this.showError(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showError('Error de conexión. Intenta nuevamente.');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Validar contraseñas coincidan
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            this.showError('Las contraseñas no coinciden');
            return;
        }

        const registerData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: password,
            name: formData.get('name'),
            role: formData.get('role'),
            profile: {
                phone: formData.get('phone') || '',
                address: formData.get('address') || '',
                city: '',
                country: ''
            }
        };

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuthData(data.token, data.user);
                
                // Redirigir según el rol
                this.redirectByRole(data.user.role);
            } else {
                this.showError(data.message || 'Error al crear cuenta');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.showError('Error de conexión. Intenta nuevamente.');
        } finally {
            this.showLoading(false);
        }
    }

    async checkAuthStatus() {
        if (!this.token) {
            this.updateUIForGuest();
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.updateUIForAuthenticated();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Error verificando auth:', error);
            this.logout();
        }
    }

    setAuthData(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirigir a login
        if (!window.location.pathname.includes('login') && 
            !window.location.pathname.includes('register') && 
            !window.location.pathname.includes('catalog')) {
            window.location.href = '/login';
        }
        
        this.updateUIForGuest();
    }

    redirectByRole(role) {
        const roleRedirects = {
            'superadmin': '/admin',
            'admin': '/admin',
            'employee': '/employee',
            'customer': '/customer'
        };

        const redirectUrl = roleRedirects[role] || '/dashboard';
        window.location.href = redirectUrl;
    }

    updateUIForAuthenticated() {
        // Actualizar navegación
        const loginNavItem = document.getElementById('login-nav-item');
        const userNavItem = document.getElementById('user-nav-item');
        const userNameDisplay = document.getElementById('user-name-display');

        if (loginNavItem) loginNavItem.style.display = 'none';
        if (userNavItem) userNavItem.style.display = 'block';
        if (userNameDisplay) userNameDisplay.textContent = this.user.name || this.user.username;

        // Redirigir si está en páginas de auth
        if (window.location.pathname.includes('/login') || 
            window.location.pathname.includes('/register')) {
            this.redirectByRole(this.user.role);
        }
    }

    updateUIForGuest() {
        // Actualizar navegación
        const loginNavItem = document.getElementById('login-nav-item');
        const userNavItem = document.getElementById('user-nav-item');

        if (loginNavItem) loginNavItem.style.display = 'block';
        if (userNavItem) userNavItem.style.display = 'none';
    }

    togglePassword(inputId = 'password') {
        const input = document.getElementById(inputId);
        const button = input.nextElementSibling;
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    }

    showError(message) {
        // Crear alerta de error
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Estilos
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(alert);

        // Auto remover después de 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }

    showSuccess(message) {
        // Crear alerta de éxito
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Estilos
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(alert);

        // Auto remover después de 3 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 3000);
    }

    // Método para hacer peticiones autenticadas
    async authenticatedFetch(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (this.token) {
            defaultOptions.headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...defaultOptions,
            ...options
        });

        // Si el token expiró, hacer logout
        if (response.status === 401) {
            this.logout();
            throw new Error('Sesión expirada');
        }

        return response;
    }

    // Verificar permisos de rol
    hasRole(requiredRole) {
        if (!this.user) return false;
        
        const roleHierarchy = {
            'customer': 1,
            'employee': 2,
            'admin': 3,
            'superadmin': 4
        };

        return roleHierarchy[this.user.role] >= roleHierarchy[requiredRole];
    }

    // Verificar si puede acceder a una ruta
    canAccess(path) {
        if (!this.user) {
            // Rutas públicas
            const publicRoutes = ['/login', '/register', '/catalog', '/'];
            return publicRoutes.includes(path) || path === '/';
        }

        const roleRoutes = {
            'superadmin': ['/', '/dashboard', '/admin', '/employee', '/customer', '/customers', '/inventory'],
            'admin': ['/', '/dashboard', '/admin', '/employee', '/customer', '/customers', '/inventory'],
            'employee': ['/', '/dashboard', '/employee', '/customer', '/customers', '/inventory'],
            'customer': ['/', '/dashboard', '/customer', '/catalog']
        };

        return roleRoutes[this.user.role]?.includes(path) || false;
    }
}

// Instancia global
window.authSystem = new AuthSystem();

// Funciones globales para compatibilidad
function togglePassword(inputId) {
    window.authSystem.togglePassword(inputId);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // La instancia ya se inicializó en el constructor
});

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}
