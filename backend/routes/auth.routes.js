import express from 'express'
import { registerUser, login, logout, resetPassword } from "../controllers/auth.controller.js";
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router()

router.post('/register', registerUser);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/reset-password', resetPassword);

export default router