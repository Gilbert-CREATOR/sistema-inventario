const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

const INVENTORY_FILE = path.join(__dirname, '../../data/inventory.json');

// Obtener catálogo público (para clientes)
router.get('/', async (req, res) => {
    try {
        // Leer inventario
        let inventory = [];
        try {
            const data = await fs.readFile(INVENTORY_FILE, 'utf8');
            inventory = JSON.parse(data);
        } catch (error) {
            // Si no hay inventario, devolver array vacío
            inventory = [];
        }

        // Filtrar solo productos con stock > 0
        const availableProducts = inventory.filter(item => item.stock > 0);

        // Formatear productos para el catálogo (sin información sensible)
        const catalogProducts = availableProducts.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            stock: item.stock, // Mostrar stock disponible
            description: item.description || '',
            sku: item.sku || '',
            images: item.images || [], // Array de URLs de imágenes
            features: item.features || [], // Características del producto
            rating: item.rating || 0, // Calificación promedio
            reviews: item.reviews || 0, // Número de reseñas
            tags: item.tags || [], // Etiquetas para búsqueda
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }));

        // Opciones de filtrado y ordenamiento
        const { 
            category, 
            minPrice, 
            maxPrice, 
            search, 
            sortBy = 'name', 
            sortOrder = 'asc',
            page = 1,
            limit = 20
        } = req.query;

        let filteredProducts = catalogProducts;

        // Filtrar por categoría
        if (category) {
            filteredProducts = filteredProducts.filter(product => 
                product.category === category
            );
        }

        // Filtrar por rango de precio
        if (minPrice) {
            filteredProducts = filteredProducts.filter(product => 
                product.price >= parseFloat(minPrice)
            );
        }

        if (maxPrice) {
            filteredProducts = filteredProducts.filter(product => 
                product.price <= parseFloat(maxPrice)
            );
        }

        // Búsqueda por texto
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Ordenamiento
        filteredProducts.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'price':
                    comparison = a.price - b.price;
                    break;
                case 'rating':
                    comparison = a.rating - b.rating;
                    break;
                case 'stock':
                    comparison = a.stock - b.stock;
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
                default:
                    comparison = a.name.localeCompare(b.name);
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        // Paginación
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        // Obtener categorías disponibles
        const categories = [...new Set(catalogProducts.map(product => product.category))];

        // Calcular rangos de precios
        const prices = catalogProducts.map(product => product.price);
        const minAvailablePrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxAvailablePrice = prices.length > 0 ? Math.max(...prices) : 0;

        res.json({
            products: paginatedProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredProducts.length,
                totalPages: Math.ceil(filteredProducts.length / parseInt(limit))
            },
            filters: {
                categories,
                priceRange: {
                    min: minAvailablePrice,
                    max: maxAvailablePrice
                }
            },
            stats: {
                totalProducts: catalogProducts.length,
                availableProducts: availableProducts.length,
                categories: categories.length
            }
        });
    } catch (error) {
        console.error('Error obteniendo catálogo:', error);
        res.status(500).json({ message: 'Error al obtener catálogo' });
    }
});

// Obtener detalles de un producto específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Leer inventario
        let inventory = [];
        try {
            const data = await fs.readFile(INVENTORY_FILE, 'utf8');
            inventory = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Buscar producto
        const product = inventory.find(item => item.id === parseInt(id));

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Solo mostrar si hay stock disponible
        if (product.stock <= 0) {
            return res.status(404).json({ message: 'Producto no disponible' });
        }

        // Formatear para catálogo
        const catalogProduct = {
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            description: product.description || '',
            sku: product.sku || '',
            images: product.images || [],
            features: product.features || [],
            rating: product.rating || 0,
            reviews: product.reviews || [],
            tags: product.tags || [],
            specifications: product.specifications || {}, // Especificaciones técnicas
            relatedProducts: product.relatedProducts || [], // Productos relacionados
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };

        res.json(catalogProduct);
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ message: 'Error al obtener producto' });
    }
});

// Obtener productos relacionados
router.get('/:id/related', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 4 } = req.query;

        // Leer inventario
        let inventory = [];
        try {
            const data = await fs.readFile(INVENTORY_FILE, 'utf8');
            inventory = JSON.parse(data);
        } catch (error) {
            return res.json([]);
        }

        // Buscar producto principal
        const mainProduct = inventory.find(item => item.id === parseInt(id));

        if (!mainProduct) {
            return res.json([]);
        }

        // Obtener productos relacionados por categoría
        const relatedProducts = inventory
            .filter(item => 
                item.id !== parseInt(id) && 
                item.category === mainProduct.category && 
                item.stock > 0
            )
            .slice(0, parseInt(limit))
            .map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                price: item.price,
                stock: item.stock,
                images: item.images || [],
                rating: item.rating || 0
            }));

        res.json(relatedProducts);
    } catch (error) {
        console.error('Error obteniendo productos relacionados:', error);
        res.status(500).json({ message: 'Error al obtener productos relacionados' });
    }
});

// Búsqueda avanzada
router.post('/search', async (req, res) => {
    try {
        const { 
            query, 
            filters = {}, 
            sortBy = 'relevance', 
            page = 1, 
            limit = 20 
        } = req.body;

        // Leer inventario
        let inventory = [];
        try {
            const data = await fs.readFile(INVENTORY_FILE, 'utf8');
            inventory = JSON.parse(data);
        } catch (error) {
            return res.json({
                products: [],
                pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
            });
        }

        // Filtrar productos disponibles
        let availableProducts = inventory.filter(item => item.stock > 0);

        // Aplicar filtros
        if (filters.category) {
            availableProducts = availableProducts.filter(product => 
                product.category === filters.category
            );
        }

        if (filters.priceRange) {
            availableProducts = availableProducts.filter(product => 
                product.price >= filters.priceRange.min && 
                product.price <= filters.priceRange.max
            );
        }

        if (filters.tags && filters.tags.length > 0) {
            availableProducts = availableProducts.filter(product =>
                filters.tags.some(tag => product.tags && product.tags.includes(tag))
            );
        }

        // Búsqueda por texto
        if (query) {
            const searchTerm = query.toLowerCase();
            availableProducts = availableProducts.map(product => {
                let score = 0;
                
                // Puntuación por coincidencia exacta en nombre
                if (product.name.toLowerCase() === searchTerm) score += 100;
                // Puntuación por coincidencia parcial en nombre
                else if (product.name.toLowerCase().includes(searchTerm)) score += 50;
                // Puntuación por coincidencia en descripción
                if (product.description && product.description.toLowerCase().includes(searchTerm)) score += 25;
                // Puntuación por coincidencia en categoría
                if (product.category.toLowerCase().includes(searchTerm)) score += 20;
                // Puntuación por coincidencia en tags
                if (product.tags) {
                    product.tags.forEach(tag => {
                        if (tag.toLowerCase().includes(searchTerm)) score += 15;
                    });
                }

                return { ...product, searchScore: score };
            }).filter(product => product.searchScore > 0);

            // Ordenar por relevancia
            availableProducts.sort((a, b) => b.searchScore - a.searchScore);
        }

        // Aplicar ordenamiento secundario
        if (sortBy !== 'relevance') {
            availableProducts.sort((a, b) => {
                let comparison = 0;
                switch (sortBy) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'price':
                        comparison = a.price - b.price;
                        break;
                    case 'rating':
                        comparison = a.rating - b.rating;
                        break;
                    default:
                        comparison = 0;
                }
                return comparison;
            });
        }

        // Paginación
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedProducts = availableProducts.slice(startIndex, endIndex);

        // Remover searchScore de la respuesta
        const cleanProducts = paginatedProducts.map(({ searchScore, ...product }) => product);

        res.json({
            products: cleanProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: availableProducts.length,
                totalPages: Math.ceil(availableProducts.length / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);
        res.status(500).json({ message: 'Error en búsqueda' });
    }
});

module.exports = router;
