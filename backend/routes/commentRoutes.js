import express from 'express'
const router = express.Router()
import commentController from '../controllers/commentController'

router.get('/:userId', commentController.getCommentsForUser)
router.post('/:userId', commentController.addCommentToUser)
router.put('/:userId/:commentId', commentController.updateComment)
router.delete('/:userId/:commentId', commentController.deleteComment)

export default router
