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