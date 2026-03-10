const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const roleMiddleware = require('../auth/roleMiddleware');

const router = express.Router();

const CUSTOMERS_FILE = path.join(__dirname, '../../data/customers.json');

// Obtener todos los clientes
router.get('/', async (req, res) => {
    try {
        let customers = [];
        try {
            const data = await fs.readFile(CUSTOMERS_FILE, 'utf8');
            customers = JSON.parse(data);
        } catch (error) {
            // Si no hay clientes, devolver array vacío
            customers = [];
        }

        res.json(customers);
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({ message: 'Error al obtener clientes' });
    }
});

// Crear cliente
router.post('/', async (req, res) => {
    try {
        const { name, email, credit = 0 } = req.body;

        // Validaciones básicas
        if (!name || !email) {
            return res.status(400).json({ 
                message: 'Nombre y email son requeridos' 
            });
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Email inválido' 
            });
        }

        // Leer clientes existentes
        let customers = [];
        try {
            const data = await fs.readFile(CUSTOMERS_FILE, 'utf8');
            customers = JSON.parse(data);
        } catch (error) {
            customers = [];
        }

        // Verificar si el email ya existe
        const existingCustomer = customers.find(c => c.email === email);
        if (existingCustomer) {
            return res.status(400).json({ 
                message: 'El email ya está registrado' 
            });
        }

        // Crear nuevo cliente
        const newCustomer = {
            id: Date.now(),
            name,
            email,
            credit: parseFloat(credit),
            createdAt: new Date().toISOString()
        };

        customers.push(newCustomer);

        // Guardar en archivo
        await fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));

        res.status(201).json(newCustomer);
    } catch (error) {
        console.error('Error creando cliente:', error);
        res.status(500).json({ message: 'Error al crear cliente' });
    }
});

// Actualizar cliente
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, credit } = req.body;

        // Leer clientes
        let customers = [];
        try {
            const data = await fs.readFile(CUSTOMERS_FILE, 'utf8');
            customers = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Buscar cliente
        const customerIndex = customers.findIndex(c => c.id === parseInt(id));
        if (customerIndex === -1) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Actualizar cliente
        customers[customerIndex] = {
            ...customers[customerIndex],
            name: name || customers[customerIndex].name,
            email: email || customers[customerIndex].email,
            credit: credit !== undefined ? parseFloat(credit) : customers[customerIndex].credit,
            updatedAt: new Date().toISOString()
        };

        // Guardar
        await fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));

        res.json(customers[customerIndex]);
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        res.status(500).json({ message: 'Error al actualizar cliente' });
    }
});

// Eliminar cliente
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Leer clientes
        let customers = [];
        try {
            const data = await fs.readFile(CUSTOMERS_FILE, 'utf8');
            customers = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Filtrar cliente
        const filteredCustomers = customers.filter(c => c.id !== parseInt(id));

        if (filteredCustomers.length === customers.length) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Guardar
        await fs.writeFile(CUSTOMERS_FILE, JSON.stringify(filteredCustomers, null, 2));

        res.status(204).send();
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        res.status(500).json({ message: 'Error al eliminar cliente' });
    }
});

// Gestionar crédito de cliente
router.patch('/:id/credit', async (req, res) => {
    try {
        const { id } = req.params;
        const { credit } = req.body;

        if (credit === undefined || isNaN(credit)) {
            return res.status(400).json({ 
                message: 'Monto de crédito inválido' 
            });
        }

        // Leer clientes
        let customers = [];
        try {
            const data = await fs.readFile(CUSTOMERS_FILE, 'utf8');
            customers = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Buscar cliente
        const customerIndex = customers.findIndex(c => c.id === parseInt(id));
        if (customerIndex === -1) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Actualizar crédito
        customers[customerIndex].credit += parseFloat(credit);
        customers[customerIndex].updatedAt = new Date().toISOString();

        // Guardar
        await fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));

        res.json(customers[customerIndex]);
    } catch (error) {
        console.error('Error actualizando crédito:', error);
        res.status(500).json({ message: 'Error al actualizar crédito' });
    }
});

module.exports = router;
