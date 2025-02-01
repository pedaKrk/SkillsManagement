const Comment = require('../models/commentSchema')
const User = require('../models/userSchema')

exports.getCommentsForUser = async (userId) => {
  return Comment.find({ author: userId }).populate('author', 'username').exec()
}

exports.addCommentToUser = async (userId, authorId, content) => {
  const comment = new Comment({ content, author: authorId })

  const savedComment = await comment.save()

  await User.findByIdAndUpdate(userId, { $push: { comments: savedComment._id } })

  return savedComment
}

exports.updateComment = async (userId, commentId, content) => {

  const user = await User.findById(userId)
  if (!user.comments.includes(commentId)) {
    throw new Error('Comment not found for this user')
  }

  return Comment.findByIdAndUpdate(commentId, { content }, { new: true })
}

exports.deleteComment = async (userId, commentId) => {

  await User.findByIdAndUpdate(userId, { $pull: { comments: commentId } })

  return Comment.findByIdAndDelete(commentId)
}