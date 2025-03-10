import express from 'express'
import { registerUser, login, logout } from "../controllers/auth.controller.js";
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router()

router.post('/register', registerUser);
router.post('/login', login);
// Logout-Route ist geschützt, nur eingeloggte User können sich ausloggen
router.post('/logout', authenticateToken, logout);

export default router