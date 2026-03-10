const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Acceso denegado. Token no proporcionado o formato inválido.' 
            });
        }

        const token = authHeader.substring(7); // Remover 'Bearer '

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Obtener usuario
        const users = await User.getAll();
        const user = users.find(u => u.id === decoded.id);

        if (!user) {
            return res.status(401).json({ 
                message: 'Token inválido. Usuario no encontrado.' 
            });
        }

        if (!user.active) {
            return res.status(401).json({ 
                message: 'Usuario inactivo.' 
            });
        }

        // Agregar usuario al request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Token inválido.' 
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expirado.' 
            });
        } else {
            console.error('Error en authMiddleware:', error);
            return res.status(500).json({ 
                message: 'Error en el servidor de autenticación.' 
            });
        }
    }
};

module.exports = authMiddleware;
