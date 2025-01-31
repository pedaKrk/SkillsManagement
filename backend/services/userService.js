//const User = require('../models/User');

exports.getAllUsers = async () => {
  try {
    return 'List of users'
    //const users = await User.find()
    //return users
  } catch (err) {
    throw new Error('Error fetching users: ' + err.message)
  }
};
/*
exports.createUser = async (userData) => {
  try {
    const newUser = new User(userData)
    await newUser.save()
    return newUser
  } catch (err) {
    throw new Error('Error creating user: ' + err.message)
  }
};
*/