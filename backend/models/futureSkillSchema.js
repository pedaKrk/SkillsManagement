const mongoose = require('mongoose')
const skillLevelEnum =require('./enums/skillLevelEnum')

const futureSkillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    skillId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Skills'
    },
    achievementDate: {
        type: Date,
        required: true
    },
    skillLevel: {
        type: String,
        required: true,
        enum: skillLevelEnum
    }
}, { timestamps: true })

module.exports = mongoose.model("FutureSkill", futureSkillSchema)