const mongoose = require('mongoose')

const skillSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skills',
        default: null
    },
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skills'
    }]
}, { timestamps: true })

module.exports = mongoose.model('Skills', skillSchema)
