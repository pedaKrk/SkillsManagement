import { verifyToken } from '../services/jwt.service.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = await verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.message === 'Token is blacklisted') {
            return res.status(401).json({ message: 'Token has been invalidated' });
        }
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

export const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Access denied: insufficient permissions' 
            });
        }
        next();
    };
}; 