import express from "express";
const router = express.Router();

import {
	getAllFutureSkills,
	createFutureSkill,
	updateFutureSkill,
	deleteFutureSkill,
	sendFutureSkillMail,
} from "../controllers/future.skills.controller.js";
import { getFutureSkillStatusEmail } from "../controllers/email.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

// GET all future skills
router.get("/", getAllFutureSkills);

// POST a new future skill
router.post("/", createFutureSkill);

// PUT (update) a skill by ID
router.put("/:id", updateFutureSkill);

// DELETE a skill by ID
router.delete("/:id", deleteFutureSkill);

router.post("/send-email", sendFutureSkillMail);

export default router;

/**
 * @openapi
 * /api/v1/future-skills:
 *   get:
 *     summary: Returns all future skills
 *     tags:
 *       - FutureSkills
 *     responses:
 *       200:
 *         description: List of all future skills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Error fetching future skills
 */

/**
 * @openapi
 * /api/v1/future-skills:
 *   post:
 *     summary: Create a new future skill
 *     tags:
 *       - FutureSkills
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Artificial Intelligence
 *               description:
 *                 type: string
 *                 example: Understanding and applying AI concepts
 *               category:
 *                 type: string
 *                 example: Technology
 *               future_achievable_level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced, Expert]
 *                 example: Intermediate
 *               lecturer_id:
 *                 type: string
 *                 description: User ID of the lecturer
 *                 example: 64b1234abcde56789f012345
 *               skill_id:
 *                 type: string
 *                 description: Reference to skill
 *                 example: 64b9876fedcb54321a098765
 *               target_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-01-01
 *     responses:
 *       201:
 *         description: Future skill created successfully
 *       400:
 *         description: Invalid input data
 */

/**
 * @openapi
 * /api/v1/future-skills/send-email:
 *   post:
 *     summary: Send an email related to future skills
 *     tags:
 *       - FutureSkills
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *               - subject
 *               - message
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 example:
 *                   - user1@example.com
 *                   - user2@example.com
 *               subject:
 *                 type: string
 *                 example: Your future skill progress
 *               message:
 *                 type: string
 *                 example: "<p>You have upcoming future skills to review.</p>"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Missing recipients, subject, or message
 *       500:
 *         description: Failed to send email
 */

/**
 * @openapi
 * /api/v1/future-skills/{id}:
 *   put:
 *     summary: Update an existing future skill
 *     tags:
 *       - FutureSkills
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the future skill to update
 *         schema:
 *           type: string
 *           example: 64b1234abcde56789f012345
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Artificial Intelligence
 *               description:
 *                 type: string
 *                 example: Updated description
 *               category:
 *                 type: string
 *                 example: Technology
 *               future_achievable_level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced, Expert]
 *                 example: Advanced
 *               lecturer_id:
 *                 type: string
 *                 example: 64b1234abcde56789f012345
 *               skill_id:
 *                 type: string
 *                 example: 64b9876fedcb54321a098765
 *               target_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-01
 *     responses:
 *       200:
 *         description: Future skill updated successfully
 *       400:
 *         description: Invalid skill ID
 *       404:
 *         description: Future skill not found
 *       500:
 *         description: Error updating future skill
 */

/**
 * @openapi
 * /api/v1/future-skills/{id}:
 *   delete:
 *     summary: Delete a future skill
 *     tags:
 *       - FutureSkills
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the future skill to delete
 *         schema:
 *           type: string
 *           example: 64b1234abcde56789f012345
 *     responses:
 *       200:
 *         description: Future skill deleted successfully
 *       400:
 *         description: Invalid skill ID
 *       404:
 *         description: Future skill not found
 *       500:
 *         description: Error deleting future skill
 */
