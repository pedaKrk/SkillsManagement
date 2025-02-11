import commentService from '../services/commentService'

const getCommentsForUser = async (req, res) => {
  const { userId } = req.params
  try {
    const comments = await commentService.getCommentsForUser(userId)
    res.status(200).json(comments)
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve comments', error })
  }
}

const addCommentToUser = async (req, res) => {
  const { userId } = req.params
  const { content, authorId } = req.body

  try {
    const newComment = await commentService.addCommentToUser(userId, authorId, content)
    res.status(201).json(newComment)
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error })
  }
}

const updateComment = async (req, res) => {
  const { userId, commentId } = req.params
  const { content } = req.body

  try {
    const updatedComment = await commentService.updateComment(userId, commentId, content)
    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    res.status(200).json(updatedComment)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update comment', error })
  }
}

const deleteComment = async (req, res) => {
  const { userId, commentId } = req.params

  try {
    const result = await commentService.deleteComment(userId, commentId)
    if (!result) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment', error })
  }
}

export default { getCommentsForUser, addCommentToUser, updateComment, deleteComment }
