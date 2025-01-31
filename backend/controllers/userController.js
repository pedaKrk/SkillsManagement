const userService = require('../services/userService');

exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers()
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err })
  }
};
/*
exports.createUser = async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body)
    res.status(201).json(newUser)
  } catch (err) {
    res.status(500).json({ message: 'Error creating user', error: err })
  }
};
*/