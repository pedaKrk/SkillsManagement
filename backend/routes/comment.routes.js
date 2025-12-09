import express from 'express'
const router = express.Router()
import { getCommentsForUser, addCommentToUser, updateComment, deleteComment, addReplyToComment } from '../controllers/comment.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

router.get('/:userId', authenticateToken, getCommentsForUser)
router.post('/:userId', authenticateToken, addCommentToUser)
router.put('/:userId/:commentId', authenticateToken, updateComment)
router.delete('/:userId/:commentId', authenticateToken, deleteComment)
router.post('/:userId/:commentId/replies', authenticateToken, addReplyToComment)

export default router



/**
 * @openapi
 * /api/v1/comments/{userId}:
 *   get:
 *     summary: Returns all comments for a specific user
 *     tags:
 *       - Comments
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *       401:
 *         description: Unauthorized – authentication required
 */

/**
 * @openapi
 * /api/v1/comments/{userId}:
 *   post:
 *     summary: Add a new comment to a specific user
 *     tags:
 *       - Comments
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Comment data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       401:
 *         description: Unauthorized – authentication required
 */

/**
 * @openapi
 * /api/v1/comments/{userId}/{commentId}:
 *   put:
 *     summary: Update an existing comment
 *     tags:
 *       - Comments
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated comment data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Unauthorized – authentication required
 */

/**
 * @openapi
 * /api/v1/comments/{userId}/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags:
 *       - Comments
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized – authentication required
 */

/**
 * @openapi
 * /api/v1/comments/{userId}/{commentId}/replies:
 *   post:
 *     summary: Add a reply to a specific comment
 *     tags:
 *       - Comments
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Reply data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reply added successfully
 *       401:
 *         description: Unauthorized – authentication required
 */
