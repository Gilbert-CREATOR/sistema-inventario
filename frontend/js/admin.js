// Sistema de Administración
class AdminSystem {
    constructor() {
        this.user = null;
        this.users = [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.loadAdminData();
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

        // Agregar usuario
        document.getElementById('add-user-btn')?.addEventListener('click', () => {
            this.openUserModal();
        });

        // Modal de usuario
        const userModal = document.getElementById('user-modal');
        const closeModal = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const userForm = document.getElementById('user-form');

        if (closeModal) closeModal.addEventListener('click', () => this.closeUserModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeUserModal());
        if (userForm) userForm.addEventListener('submit', (e) => this.handleUserSubmit(e));

        // Filtros
        document.getElementById('role-filter')?.addEventListener('change', () => this.filterUsers());
        document.getElementById('status-filter')?.addEventListener('change', () => this.filterUsers());
        document.getElementById('user-search')?.addEventListener('input', () => this.filterUsers());

        // Logs
        document.getElementById('refresh-logs')?.addEventListener('click', () => this.refreshLogs());

        // Cerrar modales al hacer clic fuera
        if (userModal) {
            userModal.addEventListener('click', (e) => {
                if (e.target === userModal) {
                    this.closeUserModal();
                }
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
                
                // Verificar que sea admin o superadmin
                if (!['admin', 'superadmin'].includes(this.user.role)) {
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
        if (userNameDisplay) {
            userNameDisplay.textContent = this.user.name || this.user.username;
        }
    }

    async loadAdminData() {
        try {
            await this.loadUsers();
            await this.loadUserStats();
            this.renderUsers();
        } catch (error) {
            console.error('Error cargando datos de administración:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await window.authSystem.authenticatedFetch('/api/users');
            if (response.ok) {
                this.users = await response.json();
            } else {
                this.users = [];
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            this.users = [];
        }
    }

    async loadUserStats() {
        try {
            const response = await window.authSystem.authenticatedFetch('/api/users/stats/overview');
            if (response.ok) {
                const stats = await response.json();
                this.updateStatsDisplay(stats);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('total-users').textContent = stats.total || 0;
        document.getElementById('active-users').textContent = stats.active || 0;
        document.getElementById('admin-users').textContent = (stats.byRole?.admin || 0) + (stats.byRole?.superadmin || 0);
        document.getElementById('customer-users').textContent = stats.byRole?.customer || 0;
    }

    renderUsers(users = this.users) {
        const tbody = document.getElementById('users-tbody');
        const emptyState = document.getElementById('users-empty-state');
        const tableContainer = document.querySelector('.users-table-container');

        if (!tbody) return;

        if (users.length === 0) {
            if (tableContainer) tableContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (tableContainer) tableContainer.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = users.map(user => `
            <tr data-id="${user.id}">
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.name || '-'}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge ${user.role}">
                        ${this.getRoleDisplayName(user.role)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.active ? 'active' : 'inactive'}">
                        ${user.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>${user.lastLogin ? this.formatDate(user.lastLogin) : 'Nunca'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="adminSystem.editUser(${user.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.active ? `
                            <button class="btn btn-sm btn-warning" onclick="adminSystem.deactivateUser(${user.id})" title="Desactivar">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-success" onclick="adminSystem.activateUser(${user.id})" title="Activar">
                                <i class="fas fa-check"></i>
                            </button>
                        `}
                        ${user.id !== this.user.id && user.role !== 'superadmin' ? `
                            <button class="btn btn-sm btn-danger" onclick="adminSystem.deleteUser(${user.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'superadmin': 'Super Admin',
            'admin': 'Administrador',
            'employee': 'Empleado',
            'customer': 'Cliente'
        };
        return roleNames[role] || role;
    }

    filterUsers() {
        const roleFilter = document.getElementById('role-filter')?.value;
        const statusFilter = document.getElementById('status-filter')?.value;
        const searchQuery = document.getElementById('user-search')?.value.toLowerCase();

        let filteredUsers = this.users;

        // Filtrar por rol
        if (roleFilter) {
            filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }

        // Filtrar por estado
        if (statusFilter) {
            const isActive = statusFilter === 'active';
            filteredUsers = filteredUsers.filter(user => user.active === isActive);
        }

        // Filtrar por búsqueda
        if (searchQuery) {
            filteredUsers = filteredUsers.filter(user =>
                user.username.toLowerCase().includes(searchQuery) ||
                user.email.toLowerCase().includes(searchQuery) ||
                (user.name && user.name.toLowerCase().includes(searchQuery))
            );
        }

        this.renderUsers(filteredUsers);
    }

    openUserModal(userId = null) {
        const modal = document.getElementById('user-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('user-form');

        if (!modal || !modalTitle || !form) return;

        if (userId) {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                modalTitle.textContent = 'Editar Usuario';
                document.getElementById('user-username').value = user.username;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-name').value = user.name || '';
                document.getElementById('user-role').value = user.role;
                document.getElementById('user-phone').value = user.profile?.phone || '';
                document.getElementById('user-address').value = user.profile?.address || '';
                document.getElementById('user-password').value = '';
                this.currentEditId = userId;
            }
        } else {
            modalTitle.textContent = 'Nuevo Usuario';
            form.reset();
            this.currentEditId = null;
        }

        modal.classList.add('active');
    }

    closeUserModal() {
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('user-form').reset();
            this.currentEditId = null;
        }
    }

    async handleUserSubmit(e) {
        e.preventDefault();

        const formData = {
            username: document.getElementById('user-username').value,
            email: document.getElementById('user-email').value,
            name: document.getElementById('user-name').value,
            role: document.getElementById('user-role').value,
            profile: {
                phone: document.getElementById('user-phone').value,
                address: document.getElementById('user-address').value,
                city: '',
                country: ''
            }
        };

        const password = document.getElementById('user-password').value;
        if (password) {
            formData.password = password;
        }

        try {
            let response;
            if (this.currentEditId) {
                response = await window.authSystem.authenticatedFetch(`/api/users/${this.currentEditId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                response = await window.authSystem.authenticatedFetch('/api/users', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }

            if (response.ok) {
                window.authSystem.showSuccess(
                    this.currentEditId ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente'
                );
                this.closeUserModal();
                await this.loadUsers();
                await this.loadUserStats();
            } else {
                const error = await response.json();
                window.authSystem.showError(error.message || 'Error al guardar usuario');
            }
        } catch (error) {
            console.error('Error guardando usuario:', error);
            window.authSystem.showError('Error de conexión');
        }
    }

    editUser(userId) {
        this.openUserModal(userId);
    }

    async deactivateUser(userId) {
        if (!confirm('¿Estás seguro de que quieres desactivar este usuario?')) return;

        try {
            const response = await window.authSystem.authenticatedFetch(`/api/users/${userId}/deactivate`, {
                method: 'PATCH'
            });

            if (response.ok) {
                window.authSystem.showSuccess('Usuario desactivado exitosamente');
                await this.loadUsers();
                await this.loadUserStats();
            } else {
                const error = await response.json();
                window.authSystem.showError(error.message || 'Error al desactivar usuario');
            }
        } catch (error) {
            console.error('Error desactivando usuario:', error);
            window.authSystem.showError('Error de conexión');
        }
    }

    async activateUser(userId) {
        try {
            const response = await window.authSystem.authenticatedFetch(`/api/users/${userId}/activate`, {
                method: 'PATCH'
            });

            if (response.ok) {
                window.authSystem.showSuccess('Usuario activado exitosamente');
                await this.loadUsers();
                await this.loadUserStats();
            } else {
                const error = await response.json();
                window.authSystem.showError(error.message || 'Error al activar usuario');
            }
        } catch (error) {
            console.error('Error activando usuario:', error);
            window.authSystem.showError('Error de conexión');
        }
    }

    async deleteUser(userId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) return;

        try {
            const response = await window.authSystem.authenticatedFetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                window.authSystem.showSuccess('Usuario eliminado exitosamente');
                await this.loadUsers();
                await this.loadUserStats();
            } else {
                const error = await response.json();
                window.authSystem.showError(error.message || 'Error al eliminar usuario');
            }
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            window.authSystem.showError('Error de conexión');
        }
    }

    refreshLogs() {
        window.authSystem.showInfo('Logs del sistema en desarrollo');
    }

    openProfileModal() {
        window.authSystem.showInfo('Perfil de administrador en desarrollo');
    }

    openSettingsModal() {
        window.authSystem.showInfo('Configuración en desarrollo');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Funciones globales para configuración
function openConfigModal(type) {
    window.authSystem.showInfo(`Configuración de ${type} en desarrollo`);
}

// Instancia global
window.adminSystem = new AdminSystem();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // La instancia ya se inicializó en el constructor
});
