import express from 'express'
const router = express.Router()
import { getCommentsForUser, addCommentToUser, updateComment, deleteComment } from '../controllers/comment.controller.js'

router.get('/:userId', getCommentsForUser)
router.post('/:userId', addCommentToUser)
router.put('/:userId/:commentId', updateComment)
router.delete('/:userId/:commentId', deleteComment)

export default router