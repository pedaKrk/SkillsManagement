const mongoose = require('mongoose')
const roleEnum = require('./enums/roleEnum')
const employmentTypeEnum = require('./enums/employmentTypeEnum')

const userSchema = mongoose.Schema({
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
        enum: roleEnum,
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
    employmentType: {
        type: String,
        enum: employmentTypeEnum,
        required: true
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
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

const User = mongoose.model("User", userSchema)

module.exports = User
