import mongoose from 'mongoose'

const attachmentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    }
}, { _id: false });

const commentModel = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    isRichText: {
        type: Boolean,
        default: false
    },
    attachments: {
        type: [attachmentSchema],
        default: []
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    time_stamp: {
        type: Date,
        default: Date.now
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    }
}, { timestamps: true })

export default mongoose.model('Comment', commentModel)
