import * as commentRepository from '../repositories/comment.repository.js'
import UserRepository from "../repositories/user.repository.js";
import {NotFoundError} from "../errors/not.found.error.js";
import {ForbiddenError} from "../errors/forbidden.error.js";
import roleEnum from "../models/enums/role.enum.js";

export const getCommentsForUser = async (userId) => {
    try {
        const user = await UserRepository.loadCommentsFromUser(userId);
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
    const user = await UserRepository.findUserById(userId);
    if (!user) {
        throw new NotFoundError();
    }
    const authorExists = await UserRepository.userExists(authorId)
    if(!authorExists) {
        throw new NotFoundError();
    }
    const commentData = {
        content,
        author: authorId,
        time_stamp: new Date()
    }
    const newComment = await commentRepository.createComment(commentData)

    await UserRepository.addCommentToUser(userId, newComment.id)

    return await commentRepository.findPopulatedComment(newComment.id);
}

export const updateCommentForUser = async (userId, commentId, content, currentUserId, currentUserRole) => {
    try {
        const user = await UserRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundError();
        }
        const hasComment = await UserRepository.userHasComment(userId, commentId);
        if(!hasComment) {
            throw new NotFoundError();
        }

        // Check if comment exists and get author
        const comment = await commentRepository.findCommentById(commentId);
        if (!comment) {
            throw new NotFoundError();
        }

        // Check permissions: only author can update
        const isAuthor = comment.author.toString() === currentUserId;
        
        if (!isAuthor) {
            throw new ForbiddenError();
        }

        return await commentRepository.updateCommentById(commentId, content)
    }
    catch (error) {
        throw error;
    }
}

export const deleteCommentFromUser = async (userId, commentId, currentUserId, currentUserRole) => {
    try{
        // Check if comment exists and get author
        const comment = await commentRepository.findCommentById(commentId);
        if (!comment) {
            throw new NotFoundError();
        }

        // Check permissions: only author or admin can delete
        const isAuthor = comment.author.toString() === currentUserId;
        const isAdmin = currentUserRole && currentUserRole.toLowerCase() === roleEnum.ADMIN.toLowerCase();
        
        if (!isAuthor && !isAdmin) {
            throw new ForbiddenError();
        }

        await UserRepository.removeCommentFromUser(userId, commentId);
        return await commentRepository.deleteCommentById(commentId);
    }catch(error){
        throw error;
    }
}

export const createReplyToComment = async (userId, commentId, authorId, content) => {
    try{
        const user = await UserRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundError();
        }
        const parentComment = await commentRepository.findCommentById(commentId);
        if (!parentComment) {
            throw new NotFoundError();
        }
        const hasComment = await UserRepository.userHasComment(userId, commentId);
        if(!hasComment) {
            throw new NotFoundError();
        }
        const authorExists = await UserRepository.userExists(authorId);
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