import User from "../models/user.model.js";
import mongoose from "mongoose";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('skills futureSkills comments')
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get users', error })
  }
}

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id).populate('skills futureSkills comments')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user', error })
  }
}

export const createUser = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const userData = req.body

    const newUser = new User(userData)
    await newUser.save()

    await session.commitTransaction()
    await session.endSession()
    res.status(201).json(newUser)
  } catch (error) {
    await session.abortTransaction()
    await session.endSession()
    res.status(500).json({ message: 'Failed to create user', error })
  }
}

export const updateUser = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { id } = req.params
    const userData = req.body
    const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true })

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    await session.commitTransaction()
    await session.endSession()
    res.status(200).json(updatedUser)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const result = await User.findByIdAndDelete(id)
    if (!result) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error })
  }
}