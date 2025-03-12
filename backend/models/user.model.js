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
    mustChangePassword: Boolean,
    employmentType: {
        type: String,
        enum: employmentTypeEnum,
        required: true
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comments"
    }],
    skills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skills"
    }],
    futureSkills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "FutureSkills"
    }]
}, { collection: 'users' })

export default mongoose.model("User", userModel)
