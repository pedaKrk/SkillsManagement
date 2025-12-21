import express from "express";
import {
	registerUser,
	login,
	logout,
	resetPassword,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/logout", authenticateToken, logout);
router.post("/reset-password", resetPassword);

export default router;

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               employmentType:
 *                 type: Internal | External
 *               skills:
 *                 type: Skill ObjectId
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Bad request – missing or invalid fields
 */

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user with email/username and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       description: User login credentials
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in, returns token and user info
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive or password must be changed
 */

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user and invalidate token
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       400:
 *         description: No token provided
 *       401:
 *         description: Unauthorized – authentication required
 */

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password for a user
 *     tags:
 *       - Auth
 *     requestBody:
 *       description: Email address of the user to reset password
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully, email sent
 *       400:
 *         description: Email not provided
 *       404:
 *         description: User not found
 */
