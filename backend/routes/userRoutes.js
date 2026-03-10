const express = require('express');
const User = require('../models/User');
const roleMiddleware = require('../auth/roleMiddleware');

const router = express.Router();

// Obtener todos los usuarios (solo admin y superadmin)
router.get('/', roleMiddleware(['superadmin', 'admin']), async (req, res) => {
    try {
        const users = await User.getAll();
        
        // Remover passwords de la respuesta
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.json(usersWithoutPasswords);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

// Obtener usuario por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Solo puede ver su propio perfil o si es admin/superadmin
        if (req.user.id !== id && !['superadmin', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Remover password
        const { password, ...userWithoutPassword } = user;

        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
});

// Crear usuario (solo admin y superadmin)
router.post('/', roleMiddleware(['superadmin', 'admin']), async (req, res) => {
    try {
        const { username, email, password, role, name, profile } = req.body;

        // Validaciones
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: 'Username, email y password son requeridos' 
            });
        }

        // Solo superadmin puede crear otros superadmin o admin
        if (req.user.role !== 'superadmin' && ['superadmin', 'admin'].includes(role)) {
            return res.status(403).json({ 
                message: 'No tienes permisos para crear usuarios con este rol' 
            });
        }

        const newUser = await User.create({
            username,
            email,
            password,
            role: role || 'customer',
            name,
            profile
        });

        // Remover password
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(400).json({ 
            message: error.message || 'Error al crear usuario' 
        });
    }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Solo puede actualizar su propio perfil o si es admin/superadmin
        if (req.user.id !== id && !['superadmin', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        // Si no es admin/superadmin, no puede cambiar el rol
        if (!['superadmin', 'admin'].includes(req.user.role) && updateData.role) {
            delete updateData.role;
        }

        // Solo superadmin puede cambiar roles a superadmin o admin
        if (req.user.role !== 'superadmin' && updateData.role && ['superadmin', 'admin'].includes(updateData.role)) {
            return res.status(403).json({ 
                message: 'No tienes permisos para asignar este rol' 
            });
        }

        const updatedUser = await User.update(id, updateData);

        // Remover password
        const { password, ...userWithoutPassword } = updatedUser;

        res.json({
            message: 'Usuario actualizado exitosamente',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(400).json({ 
            message: error.message || 'Error al actualizar usuario' 
        });
    }
});

// Desactivar usuario (solo admin y superadmin)
router.patch('/:id/deactivate', roleMiddleware(['superadmin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // No puede desactivarse a sí mismo
        if (req.user.id === id) {
            return res.status(400).json({ 
                message: 'No puedes desactivar tu propio usuario' 
            });
        }

        // Solo superadmin puede desactivar a otros admin
        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (req.user.role !== 'superadmin' && targetUser.role === 'admin') {
            return res.status(403).json({ 
                message: 'No tienes permisos para desactivar a este usuario' 
            });
        }

        await User.deactivate(id);

        res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (error) {
        console.error('Error desactivando usuario:', error);
        res.status(500).json({ message: 'Error al desactivar usuario' });
    }
});

// Activar usuario (solo admin y superadmin)
router.patch('/:id/activate', roleMiddleware(['superadmin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        await User.activate(id);

        res.json({ message: 'Usuario activado exitosamente' });
    } catch (error) {
        console.error('Error activando usuario:', error);
        res.status(500).json({ message: 'Error al activar usuario' });
    }
});

// Obtener estadísticas de usuarios (solo admin y superadmin)
router.get('/stats/overview', roleMiddleware(['superadmin', 'admin']), async (req, res) => {
    try {
        const stats = await User.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
