import express from 'express';
import { sendEmail, getFutureSkillStatusEmail } from '../controllers/email.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route to send an email to multiple recipients
// POST /api/email/send
router.post('/send', authenticateToken, sendEmail);
router.get('/future-skill-status-email', authenticateToken, getFutureSkillStatusEmail);

export default router; 