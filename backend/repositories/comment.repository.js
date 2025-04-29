import mongoose from 'mongoose';
import Comment from '../models/comment.model.js';
import User from '../models/user.model.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const findUserById = async (userId) => {
    if (!isValidObjectId(userId)) return null;
    return await User.findById(userId).exec();
};

const findCommentById = async (commentId) => {
    if (!isValidObjectId(commentId)) return null;
    return await Comment.findById(commentId).exec();
};

const createReply = async (commentId, content, authorId) => {
    const newReply = new Comment({
        content,
        author: authorId,
        time_stamp: new Date(),
        parentComment: commentId,
    });

    return await newReply.save();
};

const addReplyToComment = async (commentId, replyId) => {
    return await Comment.findByIdAndUpdate(
        commentId,
        { $push: { replies: replyId } },
        { new: true }
    ).exec();
};

const populateReplyWithAuthor = async (replyId) => {
    return await Comment.findById(replyId)
        .populate('author', 'username')
        .exec();
};

export const commentRepository = {
    findUserById,
    findCommentById,
    createReply,
    addReplyToComment,
    populateReplyWithAuthor,
};
