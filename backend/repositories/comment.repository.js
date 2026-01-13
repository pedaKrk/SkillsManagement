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

export const updateCommentById = (commentId, content, isRichText = false, attachments = null) => {
    const updateData = { content, isRichText };
    if (attachments !== null) {
        updateData.attachments = attachments;
    }
    return Comment.findByIdAndUpdate(commentId, updateData, { new: true });
}

export const deleteCommentById = (commentId) =>
    Comment.findByIdAndDelete(commentId)

export const addReplyToComment = (commentId, replyId) =>
    Comment.findByIdAndUpdate(commentId, { $push: { replies: replyId } })

export const createComment = (commentData) => new Comment(commentData).save();

// Reply helpers
export const updateReplyById = (replyId, content, isRichText = false, attachments = null) => {
    const updateData = { content, isRichText };
    if (attachments !== null) {
        updateData.attachments = attachments;
    }
    return Comment.findByIdAndUpdate(replyId, updateData, { new: true });
};

export const deleteReplyById = (replyId) =>
    Comment.findByIdAndDelete(replyId);

export const removeReplyFromComment = (commentId, replyId) =>
    Comment.findByIdAndUpdate(commentId, { $pull: { replies: replyId } });
