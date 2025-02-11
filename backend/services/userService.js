const User = require('../models/userSchema')

const getAllUsers = async () => {
  return User.find().populate('skills futureSkills comments')
}

const getUserById = async (id) => {
  return User.findById(id).populate('skills futureSkills comments')
}

const createUser = async (userData) => {
  const user = new User(userData)
  return user.save()
}

const updateUser = async (id, userData) => {
  return User.findByIdAndUpdate(id, userData, { new: true })
}

const deleteUser = async (id) => {
  return User.findByIdAndDelete(id)
}

export default { getAllUsers, getUserById, createUser, updateUser, deleteUser }