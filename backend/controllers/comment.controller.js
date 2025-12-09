import mongoose from 'mongoose'
import * as commentService from '../services/comment.service.js'
import logger from '../config/logger.js'

export const getCommentsForUser = async (req, res) => {
  try {
    const { userId } = req.params
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId");
    }

    const comments = await commentService.getCommentsForUser(userId)
    logger.debug(`Retrieved ${comments.length} comments for user: ${userId}`);
    res.status(200).json(comments)
  } catch (error) {
    logger.error('Error fetching comments:', error)
    res.status(500).json({ message: 'Fehler beim Abrufen der Kommentare', error: error.message })
  }
}

export const addCommentToUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { content } = req.body
    const commentAuthorId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid user ID for comment:', userId);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    if (!commentAuthorId || !mongoose.Types.ObjectId.isValid(commentAuthorId)) {
      logger.warn('Invalid author ID from token:', commentAuthorId);
      return res.status(400).json({ message: 'Keine gültige Autor-ID verfügbar' });
    }

    const populatedComment = await commentService.createCommentForUser(userId, commentAuthorId, content)
    logger.info(`Comment added to user ${userId} by ${commentAuthorId}`);
    res.status(201).json(populatedComment)
  } catch (error) {
    logger.error('Error adding comment:', error)
    res.status(500).json({ message: 'Fehler beim Hinzufügen des Kommentars', error: error.message })
  }
}

export const updateComment = async (req, res) => {
  try {
    const { userId, commentId } = req.params
    const { content } = req.body
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid user ID for comment update:', userId);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      logger.warn('Invalid comment ID for update:', commentId);
      return res.status(400).json({ message: 'Ungültige Kommentar-ID' });
    }

    const updatedComment = await commentService.updateCommentForUser(userId, commentId, content, currentUserId, currentUserRole)

    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    logger.info(`Comment ${commentId} updated by user ${currentUserId}`);
    res.status(200).json(updatedComment)
  } catch (error) {
    if (error.name === 'ForbiddenError' || error.constructor.name === 'ForbiddenError') {
      logger.warn(`User ${req.user.id} attempted to update comment ${req.params.commentId} without permission`);
      return res.status(403).json({ message: 'Sie haben keine Berechtigung, diesen Kommentar zu bearbeiten' });
    }
    logger.error('Error updating comment:', error);
    res.status(500).json({ message: 'Failed to update comment', error: error.message })
  }
}

export const deleteComment = async (req, res) => {
  try {
    const { userId, commentId } = req.params
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid user ID for comment deletion:', userId);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      logger.warn('Invalid comment ID for deletion:', commentId);
      return res.status(400).json({ message: 'Ungültige Kommentar-ID' });
    }

    const result = await commentService.deleteCommentFromUser(userId, commentId, currentUserId, currentUserRole)
    if (!result) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    logger.info(`Comment ${commentId} deleted by user ${currentUserId}`);
    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    if (error.name === 'ForbiddenError' || error.constructor.name === 'ForbiddenError') {
      logger.warn(`User ${req.user.id} attempted to delete comment ${req.params.commentId} without permission`);
      return res.status(403).json({ message: 'Sie haben keine Berechtigung, diesen Kommentar zu löschen' });
    }
    logger.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment', error: error.message })
  }
}

export const addReplyToComment = async (req, res) => {
  try {
    const { userId, commentId } = req.params
    const { content } = req.body
    let replyAuthorId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid user ID for reply:', userId);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      logger.warn('Invalid comment ID for reply:', commentId);
      return res.status(400).json({ message: 'Ungültige Kommentar-ID' });
    }

    if (!replyAuthorId || !mongoose.Types.ObjectId.isValid(replyAuthorId)) {
      logger.warn('Invalid author ID from token for reply:', replyAuthorId);
      return res.status(400).json({ message: 'Keine gültige Autor-ID verfügbar' });
    }

    const populatedReply = await commentService.createReplyToComment(userId, commentId, replyAuthorId, content);
    logger.info(`Reply added to comment ${commentId} by ${replyAuthorId}`);
    res.status(201).json(populatedReply)
  } catch (error) {
    logger.error('Error adding reply:', error)
    res.status(500).json({ message: 'Fehler beim Hinzufügen der Antwort', error: error.message })
  }
}