import express from 'express';
import { sendEmail, getFutureSkillStatusEmail, getUserListEmail } from '../controllers/email.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route to send an email to multiple recipients
// POST /api/email/send
router.post('/send', authenticateToken, sendEmail);
router.get('/future-skill-status-email', authenticateToken, getFutureSkillStatusEmail);
router.get('/user-list-email', authenticateToken, getUserListEmail);

export default router; 