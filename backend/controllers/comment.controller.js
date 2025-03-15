import mongoose from 'mongoose'

import User from '../models/user.model.js'
import Comment from '../models/comment.model.js'

export const getCommentsForUser = async (req, res) => {
  try {
    const { userId } = req.params
    console.log('Kommentare abrufen für Benutzer:', userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Ungültige Benutzer-ID:', userId);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    const user = await User.findById(userId).select('comments').exec()
    
    if (!user) {
      console.error('Benutzer nicht gefunden:', userId);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' })
    }
    
    console.log('Benutzer gefunden, Kommentare:', user.comments);
    
    if (!user.comments || user.comments.length === 0) {
      console.log('Keine Kommentare für diesen Benutzer gefunden');
      return res.status(200).json([])
    }
    
    const comments = await Comment.find({ 
      _id: { $in: user.comments } 
    }).populate('author', 'username').exec()

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

    console.log('Kommentar hinzufügen:', { userId, authorId, content });
    console.log('Authentifizierter Benutzer:', req.user);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Ungültige Benutzer-ID:', userId);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    const user = await User.findById(userId)
    if (!user) {
      console.error('Benutzer nicht gefunden:', userId);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' })
    }

    let commentAuthorId = req.user.id;
    
    if (!commentAuthorId || !mongoose.Types.ObjectId.isValid(commentAuthorId)) {
      console.error('Ungültige Autor-ID aus Token:', commentAuthorId);
      
      if (authorId && mongoose.Types.ObjectId.isValid(authorId)) {
        console.log('Verwende Autor-ID aus dem Request-Body:', authorId);
        commentAuthorId = authorId;
      } else {
        return res.status(400).json({ message: 'Keine gültige Autor-ID verfügbar' });
      }
    }

    const authorExists = await User.exists({ _id: commentAuthorId })
    if (!authorExists) {
      console.error('Autor nicht gefunden:', commentAuthorId);
      return res.status(400).json({ message: 'Autor nicht gefunden' })
    }

    if (!content || content.trim() === '') {
      console.error('Kein Inhalt angegeben');
      return res.status(400).json({ message: 'Kommentarinhalt darf nicht leer sein' });
    }

    const newComment = new Comment({ 
      content, 
      author: commentAuthorId,
      time_stamp: new Date()
    })
    
    const savedComment = await newComment.save()
    console.log('Kommentar gespeichert:', savedComment);
    

    await User.findByIdAndUpdate(userId, { 
      $push: { comments: savedComment._id } 
    })
    console.log('Kommentar zum Benutzer hinzugefügt');


    const populatedComment = await Comment.findById(savedComment._id)
      .populate('author', 'username')
      .exec()

    console.log('Populierter Kommentar:', populatedComment);
    res.status(201).json(populatedComment)
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Kommentars:', error)
    res.status(500).json({ message: 'Fehler beim Hinzufügen des Kommentars', error: error.message })
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