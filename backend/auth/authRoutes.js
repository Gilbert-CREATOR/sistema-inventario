const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role = 'customer', name, profile } = req.body;

        // Validaciones básicas
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: 'Username, email y password son requeridos' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'El password debe tener al menos 6 caracteres' 
            });
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Email inválido' 
            });
        }

        // Validar rol
        const validRoles = ['customer', 'employee', 'admin', 'superadmin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                message: 'Rol inválido' 
            });
        }

        // Crear usuario
        const newUser = await User.create({
            username,
            email,
            password,
            role,
            name: name || username,
            profile: profile || {}
        });

        // Generar token
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name,
                active: newUser.active
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(400).json({ 
            message: error.message || 'Error al crear usuario' 
        });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            return res.status(400).json({ 
                message: 'Username/Email y password son requeridos' 
            });
        }

        // Buscar usuario
        const user = await User.findByUsernameOrEmail(usernameOrEmail);

        if (!user) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }

        if (!user.active) {
            return res.status(401).json({ 
                message: 'Usuario inactivo' 
            });
        }

        // Verificar password
        const isValidPassword = await User.verifyPassword(user, password);

        if (!isValidPassword) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }

        // Actualizar último login
        await User.update(user.id, { lastLogin: new Date().toISOString() });

        // Generar token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: user.name,
                active: user.active,
                lastLogin: new Date().toISOString(),
                profile: user.profile
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            message: 'Error en el servidor' 
        });
    }
});

// Verificar token
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Token no proporcionado' 
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id);

        if (!user || !user.active) {
            return res.status(401).json({ 
                message: 'Token inválido o usuario inactivo' 
            });
        }

        res.json({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: user.name,
                active: user.active,
                profile: user.profile
            }
        });
    } catch (error) {
        res.status(401).json({ 
            message: 'Token inválido' 
        });
    }
});

// Refrescar token
router.post('/refresh', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Token no proporcionado' 
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id);

        if (!user || !user.active) {
            return res.status(401).json({ 
                message: 'Token inválido o usuario inactivo' 
            });
        }

        // Generar nuevo token
        const newToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Token refrescado exitosamente',
            token: newToken
        });
    } catch (error) {
        res.status(401).json({ 
            message: 'Token inválido' 
        });
    }
});

// Logout (cliente-side, solo para completitud)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout exitoso' });
});

module.exports = router;
