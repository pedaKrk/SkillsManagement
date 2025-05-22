import mongoose from 'mongoose'
import * as commentService from '../services/comment.service.js'

export const getCommentsForUser = async (req, res) => {
  try {
    const { userId } = req.params
    console.log('Kommentare abrufen für Benutzer:', userId);
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId");
    }

    const comments = commentService.getCommentsForUser(userId)

    console.log(`${comments.length} Kommentare gefunden`);
    res.status(200).json(comments)
  } catch (error) {
    console.error('Fehler beim Abrufen der Kommentare:', error)
    res.status(500).json({ message: 'Fehler beim Abrufen der Kommentare', error: error.message })
  }
}

export const addCommentToUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { content, authorId } = req.body
    let commentAuthorId = req.user.id;

    console.log('Kommentar hinzufügen:', { userId, authorId, content });
    console.log('Authentifizierter Benutzer:', req.user);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Ungültige Benutzer-ID:', userId);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    //ToDo: cleanup
    if (!commentAuthorId || !mongoose.Types.ObjectId.isValid(commentAuthorId)) {
      console.error('Ungültige Autor-ID aus Token:', commentAuthorId);
      
      if (authorId && mongoose.Types.ObjectId.isValid(authorId)) {
        console.log('Verwende Autor-ID aus dem Request-Body:', authorId);
        commentAuthorId = authorId;
      } else {
        return res.status(400).json({ message: 'Keine gültige Autor-ID verfügbar' });
      }
    }

    const populatedComment = await commentService.createCommentForUser(userId, commentAuthorId, content)

    console.log('Populierter Kommentar:', populatedComment);
    res.status(201).json(populatedComment)
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Kommentars:', error)
    res.status(500).json({ message: 'Fehler beim Hinzufügen des Kommentars', error: error.message })
  }
}

export const updateComment = async (req, res) => {
  try {
    const { userId, commentId } = req.params
    const { content } = req.body

    const updatedComment = await commentService.updateCommentForUser(userId, commentId, content)

    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    res.status(200).json(updatedComment)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update comment', error })
  }
}

export const deleteComment = async (req, res) => {
  try {
    const { userId, commentId } = req.params
    const result = await commentService.deleteCommentFromUser(userId, commentId)
    if (!result) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment', error })
  }
}

export const addReplyToComment = async (req, res) => {
  try {
    const { userId, commentId } = req.params
    const { content } = req.body
    let replyAuthorId = req.user.id;

    console.log('Antwort zu Kommentar hinzufügen:', { userId, commentId, content });
    console.log('Authentifizierter Benutzer:', req.user);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Ungültige Benutzer-ID:', userId);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      console.error('Ungültige Kommentar-ID:', commentId);
      return res.status(400).json({ message: 'Ungültige Kommentar-ID' });
    }

    if (!replyAuthorId || !mongoose.Types.ObjectId.isValid(replyAuthorId)) {
      console.error('Ungültige Autor-ID aus Token:', replyAuthorId);
      return res.status(400).json({ message: 'Keine gültige Autor-ID verfügbar' });
    }

    const populatedReply = await commentService.createReplyToComment(userId, commentId, replyAuthorId, content);

    console.log('Populierte Antwort:', populatedReply);
    res.status(201).json(populatedReply)
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Antwort:', error)
    res.status(500).json({ message: 'Fehler beim Hinzufügen der Antwort', error: error.message })
  }
}