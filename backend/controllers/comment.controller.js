import mongoose from 'mongoose'

import User from '../models/user.model.js'
import Comment from '../models/comment.model.js'

export const getCommentsForUser = async (req, res) => {
  try {
    const { userId } = req.params

    const comments = await Comment.find({ author: userId }).populate('author', 'username').exec()

    res.status(200).json(comments)
  } catch (error) {
    console.log('Failed to retrieve comments', error)
    res.status(500).json({ message: 'Failed to retrieve comments', error })
  }
}

export const addCommentToUser = async (req, res) => {


  try {
    const { userId } = req.params
    const { content, authorId } = req.body

    const newComment = new Comment({ content, author: authorId })
    const savedComment = await newComment.save()
    await User.findByIdAndUpdate(userId, { $push: { comments: savedComment._id } })

    res.status(201).json(savedComment)
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error })
  }
}

export const updateComment = async (req, res) => {
  const { userId, commentId } = req.params
  const { content } = req.body

  try {
    const user = await User.findById(userId)
    if (!user.comments.includes(commentId)) {
      throw new Error('Comment not found for this user')
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true })

    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    res.status(200).json(updatedComment)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update comment', error })
  }
}

export const deleteComment = async (req, res) => {
  const { userId, commentId } = req.params

  try {
    await User.findByIdAndUpdate(userId, { $pull: { comments: commentId } })

    const result = await Comment.findByIdAndDelete(commentId)
    if (!result) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment', error })
  }
}