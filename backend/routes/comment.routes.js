import express from 'express'
const router = express.Router()
import { getCommentsForUser, addCommentToUser, updateComment, deleteComment, addReplyToComment, updateReply, deleteReply } from '../controllers/comment.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import { handleCommentAttachmentsUpload } from '../middleware/upload.middleware.js'

router.get('/:userId', authenticateToken, getCommentsForUser)
router.post('/:userId', authenticateToken, handleCommentAttachmentsUpload, addCommentToUser)
router.put('/:userId/:commentId', authenticateToken, handleCommentAttachmentsUpload, updateComment)
router.delete('/:userId/:commentId', authenticateToken, deleteComment)
router.post('/:userId/:commentId/replies', authenticateToken, handleCommentAttachmentsUpload, addReplyToComment)
router.put('/:userId/:commentId/replies/:replyId', authenticateToken, handleCommentAttachmentsUpload, updateReply)
router.delete('/:userId/:commentId/replies/:replyId', authenticateToken, deleteReply)

export default router