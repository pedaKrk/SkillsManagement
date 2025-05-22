import Comment from '../models/comment.model.js';

export const commentExists = (commentId) => Comment.exists({ _id: commentId })

export const findCommentById = (commentId) => Comment.findById(commentId)

export const findCommentsByIds = (commentIds) =>
    Comment.find({ _id: { $in: commentIds } })
        .populate('author', 'username')
        .populate({
            path: 'replies',
            populate: { path: 'author', select: 'username' }
        })

export const findPopulatedComment = (commentId) =>
    Comment.findById(commentId).populate('author', 'username')

export const updateCommentById = (commentId, content) =>
    Comment.findByIdAndUpdate(commentId, { content }, { new: true })

export const deleteCommentById = (commentId) =>
    Comment.findByIdAndDelete(commentId)

export const addReplyToComment = (commentId, replyId) =>
    Comment.findByIdAndUpdate(commentId, { $push: { replies: replyId } })

export const createComment = (commentData) => new Comment(commentData).save();
