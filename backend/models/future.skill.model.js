import mongoose from 'mongoose'
import skillLevelEnum from './enums/skill.level.enum.js'

const futureSkillModel = new mongoose.Schema({
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

export default mongoose.model("FutureSkill", futureSkillModel)