import mongoose from 'mongoose'
import roleEnum from './enums/role.enum.js'
import employmentTypeEnum from './enums/employment.type.enum.js'

const userModel = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: Object.values(roleEnum),
        required: true
    },
    title: String,
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: String,
    mustChangePassword: {
        type: Boolean,
        default: true
    },
    isActive:{
        type: Boolean,
        default: false
    },
    employmentType: {
        type: String,
        enum: employmentTypeEnum,
        required: true
    },
    profileImageUrl: {
        type: String,
        default: null
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    skills: [{
        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skills",
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    }],
    futureSkills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "FutureSkills"
    }]
}, { collection: 'users' })

const User = mongoose.model("User", userModel)
export default User
