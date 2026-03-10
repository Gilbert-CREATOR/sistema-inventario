const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Acceso denegado. Usuario no autenticado.' 
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Acceso denegado. Permisos insuficientes.' 
            });
        }

        next();
    };
};

module.exports = roleMiddleware;
