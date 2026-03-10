// Funcionalidad específica para gestión de clientes
class CustomerManager {
    constructor() {
        this.system = window.inventorySystem;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCustomers();
    }

    setupEventListeners() {
        // Botón agregar cliente
        const addBtn = document.getElementById('add-customer-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openCustomerModal());
        }

        // Modal de cliente
        const customerModal = document.getElementById('customer-modal');
        const closeModal = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const customerForm = document.getElementById('customer-form');

        if (closeModal) closeModal.addEventListener('click', () => this.closeCustomerModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeCustomerModal());
        if (customerForm) customerForm.addEventListener('submit', (e) => this.handleCustomerSubmit(e));

        // Modal de crédito
        const creditModal = document.getElementById('credit-modal');
        const closeCreditModal = document.getElementById('close-credit-modal');
        const cancelCreditBtn = document.getElementById('cancel-credit-btn');
        const creditForm = document.getElementById('credit-form');

        if (closeCreditModal) closeCreditModal.addEventListener('click', () => this.closeCreditModal());
        if (cancelCreditBtn) cancelCreditBtn.addEventListener('click', () => this.closeCreditModal());
        if (creditForm) creditForm.addEventListener('submit', (e) => this.handleCreditSubmit(e));

        // Búsqueda
        const searchInput = document.getElementById('search-customers');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Cerrar modales al hacer clic fuera
        [customerModal, creditModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
    }

    loadCustomers() {
        const customersGrid = document.getElementById('customers-grid');
        const emptyState = document.getElementById('empty-state');

        if (customersGrid && emptyState) {
            if (this.system.customers.length === 0) {
                customersGrid.style.display = 'none';
                emptyState.style.display = 'block';
            } else {
                customersGrid.style.display = 'grid';
                emptyState.style.display = 'none';
                this.renderCustomers();
            }
        }
    }

    renderCustomers(customers = this.system.customers) {
        const customersGrid = document.getElementById('customers-grid');
        if (!customersGrid) return;

        customersGrid.innerHTML = customers.map(customer => `
            <div class="customer-card" data-id="${customer.id}">
                <div class="customer-header">
                    <div class="customer-info">
                        <h3>${customer.name}</h3>
                        <div class="customer-email">${customer.email}</div>
                    </div>
                    <div class="customer-credit">
                        <div class="credit-amount">${this.system.formatCurrency(customer.credit)}</div>
                        <div class="credit-label">Crédito</div>
                    </div>
                </div>
                <div class="customer-actions">
                    <button class="btn btn-sm btn-primary" onclick="customerManager.openCreditModal(${customer.id})">
                        <i class="fas fa-dollar-sign"></i>
                        Crédito
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="customerManager.editCustomer(${customer.id})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="customerManager.deleteCustomer(${customer.id})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    openCustomerModal(customerId = null) {
        const modal = document.getElementById('customer-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('customer-form');

        if (!modal || !modalTitle || !form) return;

        if (customerId) {
            const customer = this.system.customers.find(c => c.id === customerId);
            if (customer) {
                modalTitle.textContent = 'Editar Cliente';
                document.getElementById('customer-name').value = customer.name;
                document.getElementById('customer-email').value = customer.email;
                document.getElementById('customer-credit').value = customer.credit;
                this.system.currentEditId = customerId;
            }
        } else {
            modalTitle.textContent = 'Nuevo Cliente';
            form.reset();
            this.system.currentEditId = null;
        }

        modal.classList.add('active');
    }

    closeCustomerModal() {
        const modal = document.getElementById('customer-modal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('customer-form').reset();
            this.system.currentEditId = null;
        }
    }

    handleCustomerSubmit(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('customer-name').value,
            email: document.getElementById('customer-email').value,
            credit: parseFloat(document.getElementById('customer-credit').value) || 0
        };

        if (this.system.currentEditId) {
            const updated = this.system.updateCustomer(this.system.currentEditId, formData);
            if (updated) {
                this.system.showAlert('Cliente actualizado exitosamente', 'success');
            }
        } else {
            this.system.addCustomer(formData);
            this.system.showAlert('Cliente agregado exitosamente', 'success');
        }

        this.closeCustomerModal();
        this.loadCustomers();
    }

    editCustomer(customerId) {
        this.openCustomerModal(customerId);
    }

    deleteCustomer(customerId) {
        if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            this.system.deleteCustomer(customerId);
            this.system.showAlert('Cliente eliminado exitosamente', 'success');
            this.loadCustomers();
        }
    }

    openCreditModal(customerId) {
        const modal = document.getElementById('credit-modal');
        const customer = this.system.customers.find(c => c.id === customerId);

        if (!modal || !customer) return;

        document.getElementById('credit-customer-name').textContent = customer.name;
        document.getElementById('current-credit').textContent = this.system.formatCurrency(customer.credit);
        document.getElementById('credit-amount').value = '';
        document.getElementById('credit-form').dataset.customerId = customerId;

        modal.classList.add('active');
    }

    closeCreditModal() {
        const modal = document.getElementById('credit-modal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('credit-form').reset();
        }
    }

    handleCreditSubmit(e) {
        e.preventDefault();

        const customerId = parseInt(e.target.dataset.customerId);
        const creditAmount = parseFloat(document.getElementById('credit-amount').value);

        if (isNaN(creditAmount)) {
            this.system.showAlert('Por favor ingresa un monto válido', 'error');
            return;
        }

        const updated = this.system.updateCustomerCredit(customerId, creditAmount);
        if (updated) {
            const action = creditAmount > 0 ? 'agregado' : 'quitado';
            this.system.showAlert(
                `Crédito ${action} exitosamente: ${this.system.formatCurrency(Math.abs(creditAmount))}`,
                'success'
            );
            this.closeCreditModal();
            this.loadCustomers();
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.renderCustomers();
            return;
        }

        const filtered = this.system.customers.filter(customer =>
            customer.name.toLowerCase().includes(query.toLowerCase()) ||
            customer.email.toLowerCase().includes(query.toLowerCase())
        );

        this.renderCustomers(filtered);
    }
}

// Función global para abrir el modal desde el empty state
function openCustomerModal() {
    if (window.customerManager) {
        window.customerManager.openCustomerModal();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.customerManager = new CustomerManager();
});
