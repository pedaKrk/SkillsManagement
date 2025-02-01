const User = require('../models/userSchema')

exports.getAllUsers = async () => {
  return User.find().populate('skills futureSkills comments')
}

exports.getUserById = async (id) => {
  return User.findById(id).populate('skills futureSkills comments')
}

exports.createUser = async (userData) => {
  const user = new User(userData)
  return user.save()
}

exports.updateUser = async (id, userData) => {
  return User.findByIdAndUpdate(id, userData, { new: true })
}

exports.deleteUser = async (id) => {
  return User.findByIdAndDelete(id)
}