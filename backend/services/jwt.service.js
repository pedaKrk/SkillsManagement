import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';
import BlacklistedToken from '../models/token-blacklist.model.js';

export const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            email: user.email,
            role: user.role,
            username: user.username
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

export const verifyToken = async (token) => {
    try {
        // Prüfe ob Token in Blacklist
        const isBlacklisted = await BlacklistedToken.exists({ token });
        if (isBlacklisted) {
            throw new Error('Token is blacklisted');
        }

        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

export const blacklistToken = async (token) => {
    try {
        // Decode token to get expiration
        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000); // Convert to milliseconds

        // Add to blacklist
        await BlacklistedToken.create({
            token,
            expiresAt
        });
    } catch (error) {
        throw new Error('Error blacklisting token');
    }
}; 