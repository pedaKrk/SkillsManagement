const express = require('express')
const router = express.Router()
const commentController = require('../controllers/commentController')

router.get('/:userId', commentController.getCommentsForUser)
router.post('/:userId', commentController.addCommentToUser)
router.put('/:userId/:commentId', commentController.updateComment)
router.delete('/:userId/:commentId', commentController.deleteComment)

module.exports = router
