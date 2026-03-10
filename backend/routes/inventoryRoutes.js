const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const roleMiddleware = require('../auth/roleMiddleware');

const router = express.Router();

const INVENTORY_FILE = path.join(__dirname, '../../data/inventory.json');

// Obtener todos los items del inventario
router.get('/items', async (req, res) => {
    try {
        let items = [];
        try {
            const data = await fs.readFile(INVENTORY_FILE, 'utf8');
            items = JSON.parse(data);
        } catch (error) {
            // Si no hay items, devolver array vacío
            items = [];
        }

        res.json(items);
    } catch (error) {
        console.error('Error obteniendo items:', error);
        res.status(500).json({ message: 'Error al obtener items' });
    }
});

// Crear nuevo item
router.post('/items', async (req, res) => {
    try {
        const { name, category, stock, price, minStock = 5, sku, description } = req.body;

        // Validaciones básicas
        if (!name || !category || stock === undefined || price === undefined) {
            return res.status(400).json({ 
                message: 'Nombre, categoría, stock y precio son requeridos' 
            });
        }

        // Leer items existentes
        let items = [];
        try {
            const data = await fs.readFile(INVENTORY_FILE, 'utf8');
            items = JSON.parse(data);
        } catch (error) {
            items = [];
        }

        // Crear nuevo item
        const newItem = {
            id: Date.now(),
            name,
            category,
            stock: parseInt(stock),
            price: parseFloat(price),
            minStock: parseInt(minStock),
            sku: sku || '',
            description: description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        items.push(newItem);

        // Guardar en archivo
        await fs.writeFile(INVENTORY_FILE, JSON.stringify(items, null, 2));

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creando item:', error);
        res.status(500).json({ message: 'Error al crear item' });
    }
});

// Actualizar item
router.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, stock, price, minStock, sku, description } = req.body;

        // Leer items
        let items = [];
        try {
            const data = await fs.readFile(INVENTORY_FILE, 'utf8');
            items = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // Buscar item
        const itemIndex = items.findIndex(i => i.id === parseInt(id));
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // Actualizar item
        items[itemIndex] = {
            ...items[itemIndex],
            name: name || items[itemIndex].name,
            category: category || items[itemIndex].category,
            stock: stock !== undefined ? parseInt(stock) : items[itemIndex].stock,
            price: price !== undefined ? parseFloat(price) : items[itemIndex].price,
            minStock: minStock !== undefined ? parseInt(minStock) : items[itemIndex].minStock,
            sku: sku !== undefined ? sku : items[itemIndex].sku,
            description: description !== undefined ? description : items[itemIndex].description,
            updatedAt: new Date().toISOString()
        };

        // Guardar
        await fs.writeFile(INVENTORY_FILE, JSON.stringify(items, null, 2));

        res.json(items[itemIndex]);
    } catch (error) {
        console.error('Error actualizando item:', error);
        res.status(500).json({ message: 'Error al actualizar item' });
    }
});

// Eliminar item
router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Leer items
        let items = [];
        try {
            const data = await fs.readFile(INVENTORY_FILE, 'utf8');
            items = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // Filtrar item
        const filteredItems = items.filter(i => i.id !== parseInt(id));

        if (filteredItems.length === items.length) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // Guardar
        await fs.writeFile(INVENTORY_FILE, JSON.stringify(filteredItems, null, 2));

        res.status(204).send();
    } catch (error) {
        console.error('Error eliminando item:', error);
        res.status(500).json({ message: 'Error al eliminar item' });
    }
});

// Ajustar stock
router.patch('/items/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { adjustment, reason } = req.body;

        if (adjustment === undefined || isNaN(adjustment)) {
            return res.status(400).json({ 
                message: 'Ajuste de stock inválido' 
            });
        }

        // Leer items
        let items = [];
        try {
            const data = await fs.readFile(INVENTORY_FILE, 'utf8');
            items = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // Buscar item
        const itemIndex = items.findIndex(i => i.id === parseInt(id));
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // Verificar que no quede stock negativo
        const newStock = items[itemIndex].stock + parseInt(adjustment);
        if (newStock < 0) {
            return res.status(400).json({ 
                message: 'No puede tener stock negativo' 
            });
        }

        // Actualizar stock
        items[itemIndex].stock = newStock;
        items[itemIndex].updatedAt = new Date().toISOString();
        
        // Agregar registro de ajuste
        if (!items[itemIndex].stockAdjustments) {
            items[itemIndex].stockAdjustments = [];
        }
        items[itemIndex].stockAdjustments.push({
            amount: parseInt(adjustment),
            reason: reason || 'Ajuste manual',
            date: new Date().toISOString(),
            userId: req.user.id
        });

        // Guardar
        await fs.writeFile(INVENTORY_FILE, JSON.stringify(items, null, 2));

        res.json(items[itemIndex]);
    } catch (error) {
        console.error('Error ajustando stock:', error);
        res.status(500).json({ message: 'Error al ajustar stock' });
    }
});

module.exports = router;