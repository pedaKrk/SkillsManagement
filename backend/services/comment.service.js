import * as commentRepository from '../repositories/comment.repository.js'
import * as userRepository from "../repositories/user.repository.js";
import {NotFoundError} from "../errors/not.found.error.js";

export const getCommentsForUser = async (userId) => {
    try {
        const user = await userRepository.loadCommentsFromUser(userId);
        if (!user) {
            throw new NotFoundError();
        }

        if (!user.comments || user.comments.length === 0) {
            console.info('No comments found for', userId);
            return []
        }

        return await commentRepository.findCommentsByIds(user.comments)
    }
    catch (error) {
        throw error;
    }
}

export const createCommentForUser = async (userId, authorId, content) => {
    const user = await userRepository.findUserById(userId);
    if (!user) {
        throw new NotFoundError();
    }
    const authorExists = await userRepository.userExists(authorId)
    if(!authorExists) {
        throw new NotFoundError();
    }
    const commentData = {
        content,
        author: authorId,
        time_stamp: new Date()
    }
    const newComment = await commentRepository.createComment(commentData)

    await userRepository.addCommentToUser(userId, newComment.id)

    return await commentRepository.findPopulatedComment(newComment.id);
}

export const updateCommentForUser = async (userId, commentId, content) => {
    try {
        const user = await userRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundError();
        }
        const hasComment = await userRepository.userHasComment(commentId);
        if(!hasComment) {
            throw new NotFoundError();
        }

        return await commentRepository.updateCommentById(commentId, content)
    }
    catch (error) {
        throw error;
    }
}

export const deleteCommentFromUser = async (userId, commentId) => {
    try{
        await userRepository.removeCommentFromUser(userId, commentId);
        return await commentRepository.deleteCommentById(commentId);
    }catch(error){
        throw error;
    }
}

export const createReplyToComment = async (userId, commentId, authorId, content) => {
    try{
        const user = await userRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundError();
        }
        const parentComment = await commentRepository.findCommentById(commentId);
        if (!parentComment) {
            throw new NotFoundError();
        }
        const hasComment = await userRepository.userHasComment(userId, commentId);
        if(!hasComment) {
            throw new NotFoundError();
        }
        const authorExists = await userRepository.userExists(authorId);
        if(!authorExists) {
            throw new NotFoundError();
        }

        const replyData = {
            content,
            author: authorId,
            time_stamp: new Date(),
            parentComment: commentId
        }
        const reply = await commentRepository.createComment(replyData);
        await commentRepository.addReplyToComment(commentId, reply._id)
        return await commentRepository.findPopulatedComment(reply.id)
    }
    catch(error){
        throw error;
    }
}