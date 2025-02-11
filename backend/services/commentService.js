import Comment from '../models/comment.model.js'
import User from '../models/user.model.js'

const getCommentsForUser = async (userId) => {
  return Comment.find({ author: userId }).populate('author', 'username').exec()
}

const addCommentToUser = async (userId, authorId, content) => {
  const comment = new Comment({ content, author: authorId })

  const savedComment = await comment.save()

  await User.findByIdAndUpdate(userId, { $push: { comments: savedComment._id } })

  return savedComment
}

const updateComment = async (userId, commentId, content) => {

  const user = await User.findById(userId)
  if (!user.comments.includes(commentId)) {
    throw new Error('Comment not found for this user')
  }

  return Comment.findByIdAndUpdate(commentId, { content }, { new: true })
}

const deleteComment = async (userId, commentId) => {

  await User.findByIdAndUpdate(userId, { $pull: { comments: commentId } })

  return Comment.findByIdAndDelete(commentId)
}

export default {getCommentsForUser, addCommentToUser, updateComment, deleteComment}