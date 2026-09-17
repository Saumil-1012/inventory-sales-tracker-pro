const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const staffOrAdmin = (req, res, next) => {
    if (!['ADMIN', 'MANAGER', 'STAFF', 'WAREHOUSE'].includes(req.user?.role)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};

module.exports = {
    authMiddleware,
    adminOnly,
    staffOrAdmin
};
