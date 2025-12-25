import mongoose from 'mongoose'

const futureSkillModel = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    category: {
        type: String
    },
    future_achievable_level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        default: "Beginner"
    },
    lecturer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    skill_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skills'
    },
    target_date: {
        type: Date,
        default: () => new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
}, { collection: 'futureSkills' })

export default mongoose.model("FutureSkill", futureSkillModel)