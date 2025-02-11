import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    time_stamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

export default mongoose.model('Comment', commentSchema)
