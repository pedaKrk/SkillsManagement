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
    
    // Lade Kommentare mit Autor und Antworten
    const comments = await Comment.find({ 
      _id: { $in: user.comments } 
    })
    .populate('author', 'username')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username'
      }
    })
    .exec()

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

export const addReplyToComment = async (req, res) => {
  try {
    const { userId, commentId } = req.params
    const { content } = req.body

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

    const user = await User.findById(userId)
    if (!user) {
      console.error('Benutzer nicht gefunden:', userId);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' })
    }

    const parentComment = await Comment.findById(commentId)
    if (!parentComment) {
      console.error('Kommentar nicht gefunden:', commentId);
      return res.status(404).json({ message: 'Kommentar nicht gefunden' })
    }

    if (!user.comments.includes(commentId)) {
      console.error('Kommentar gehört nicht zum Benutzer');
      return res.status(403).json({ message: 'Kommentar gehört nicht zum Benutzer' })
    }

    let replyAuthorId = req.user.id;
    
    if (!replyAuthorId || !mongoose.Types.ObjectId.isValid(replyAuthorId)) {
      console.error('Ungültige Autor-ID aus Token:', replyAuthorId);
      return res.status(400).json({ message: 'Keine gültige Autor-ID verfügbar' });
    }

    const authorExists = await User.exists({ _id: replyAuthorId })
    if (!authorExists) {
      console.error('Autor nicht gefunden:', replyAuthorId);
      return res.status(400).json({ message: 'Autor nicht gefunden' })
    }

    if (!content || content.trim() === '') {
      console.error('Kein Inhalt angegeben');
      return res.status(400).json({ message: 'Antwortinhalt darf nicht leer sein' });
    }

    //create reply
    const newReply = new Comment({ 
      content, 
      author: replyAuthorId,
      time_stamp: new Date(),
      parentComment: commentId
    })
    
    // save
    const savedReply = await newReply.save()
    console.log('Antwort gespeichert:', savedReply);
  
    await Comment.findByIdAndUpdate(commentId, { 
      $push: { replies: savedReply._id } 
    })
    console.log('Antwort zum Kommentar hinzugefügt');

    const populatedReply = await Comment.findById(savedReply._id)
      .populate('author', 'username')
      .exec()

    console.log('Populierte Antwort:', populatedReply);
    res.status(201).json(populatedReply)
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Antwort:', error)
    res.status(500).json({ message: 'Fehler beim Hinzufügen der Antwort', error: error.message })
  }
}