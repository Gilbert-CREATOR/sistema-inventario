require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importar rutas
const authRoutes = require('./backend/auth/authRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const customerRoutes = require('./backend/routes/customerRoutes');
const inventoryRoutes = require('./backend/routes/inventoryRoutes');
const catalogRoutes = require('./backend/routes/catalogRoutes');

// Importar middleware
const authMiddleware = require('./backend/auth/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite de 100 peticiones
    message: 'Demasiadas peticiones desde esta IP, intenta nuevamente más tarde.'
});
app.use('/api/', limiter);

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/catalog', catalogRoutes); // Catálogo público para clientes

// Rutas de la aplicación (para servir las páginas HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'register.html'));
});

app.get('/dashboard', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

app.get('/admin', authMiddleware, require('./backend/auth/roleMiddleware')(['superadmin', 'admin']), (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

app.get('/employee', authMiddleware, require('./backend/auth/roleMiddleware')(['superadmin', 'admin', 'employee']), (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'employee.html'));
});

app.get('/customer', authMiddleware, require('./backend/auth/roleMiddleware')(['superadmin', 'admin', 'employee', 'customer']), (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'customer.html'));
});

app.get('/catalog', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'catalog.html'));
});

// Rutas protegidas existentes
app.get('/customers', authMiddleware, require('./backend/auth/roleMiddleware')(['superadmin', 'admin', 'employee']), (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'customers.html'));
});

app.get('/inventory', authMiddleware, require('./backend/auth/roleMiddleware')(['superadmin', 'admin', 'employee']), (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'inventory.html'));
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV}`);
    console.log('Rutas disponibles:');
    console.log('  - GET  /                    (Página principal)');
    console.log('  - GET  /login               (Login)');
    console.log('  - GET  /register            (Registro)');
    console.log('  - GET  /catalog             (Catálogo público)');
    console.log('  - GET  /dashboard           (Dashboard autenticado)');
    console.log('  - GET  /admin               (Panel administrador)');
    console.log('  - GET  /employee            (Panel empleado)');
    console.log('  - GET  /customer            (Panel cliente)');
    console.log('  - GET  /customers           (Gestión clientes)');
    console.log('  - GET  /inventory           (Gestión inventario)');
    console.log('');
    console.log('API Endpoints:');
    console.log('  - POST /api/auth/login      (Login)');
    console.log('  - POST /api/auth/register   (Registro)');
    console.log('  - GET  /api/catalog         (Catálogo público)');
    console.log('  - GET  /api/users           (Usuarios - admin/superadmin)');
    console.log('  - GET  /api/customers       (Clientes - admin/employee)');
    console.log('  - GET  /api/inventory       (Inventario - admin/employee)');
});

module.exports = app;
