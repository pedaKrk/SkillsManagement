import express from "express";
import {
	sendEmail,
	getFutureSkillStatusEmail,
	getUserListEmail,
} from "../controllers/email.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { handleEmailAttachmentsUpload } from "../middleware/upload.middleware.js";

const router = express.Router();

// Route to send an email to multiple recipients
// POST /api/email/send
router.post(
	"/send",
	authenticateToken,
	handleEmailAttachmentsUpload,
	sendEmail
);
router.get(
	"/future-skill-status-email",
	authenticateToken,
	getFutureSkillStatusEmail
);
router.get("/user-list-email", authenticateToken, getUserListEmail);

export default router;

/**
 * @openapi
 * /api/v1/email/future-skill-status-email:
 *   get:
 *     summary: Returns an email template for a user's future skill status
 *     tags:
 *       - Email
 *     parameters:
 *       - in: query
 *         name: userName
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the user
 *       - in: query
 *         name: skillName
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the skill
 *     responses:
 *       200:
 *         description: Email template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 template:
 *                   type: string
 *       400:
 *         description: Missing userName or skillName
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to load template
 */

/**
 * @openapi
 * /api/email/user-list-email:
 *   get:
 *     summary: Returns an email template containing a list of users
 *     tags:
 *       - Email
 *     responses:
 *       200:
 *         description: User list email template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 template:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/v1/email/send:
 *   post:
 *     summary: Send an email
 *     tags:
 *       - Email
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *               - subject
 *               - message
 *             properties:
 *               recipients:
 *                 type: string
 *                 description: JSON array of email addresses
 *                 example: '["user2@example.com"]'
 *               subject:
 *                 type: string
 *                 example: Test email
 *               message:
 *                 type: string
 *                 example: "<p>Hello world</p>"
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Missing data or upload error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
