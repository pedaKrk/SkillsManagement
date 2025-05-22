import User from '../models/user.model.js';
import Role from '../models/enums/role.enum.js';

export const findAllUsers = () => User.find();

export const findAllActiveUsers = () => User.find({ isActive: true });

export const findAllInactiveUsers = () => User.find({ isActive: false });

export const countAllInactiveUsers = () => User.countDocuments({ isActive: false });

export const findUserById = (id) => User.findById(id);

export const findLecturers = () => User.find({ role: Role.LECTURER });

export const createUser = (userData) => new User(userData).save();

export const updateUserById = (id, userData) => User.findByIdAndUpdate(id, userData, { new: true });

export const deleteUserById = (id) => User.findByIdAndDelete(id);

export const findUserByEmail = (email) => User.findOne({ email });

export const updateUserPassword = (id, hashedPassword) =>
    User.findByIdAndUpdate(id, { $set: { password: hashedPassword, mustChangePassword: false } }, { new: true });

export const activateUserById = (id) => User.findByIdAndUpdate(id, {isActive: true}, { new: true});

export const deactivateUserById = (id) => User.findByIdAndUpdate(id, {isActive: false}, { new: true});

export const findUserStatusById = (id) => User.findById(id).select('isActive');

export const updateUserProfileImage = (id, profileImageUrl) =>
    User.findByIdAndUpdate(id, { $set: { profileImageUrl } }, { new: true });

export const loadCommentsFromUser = (id) => User.findById(id).select('comments');

export const userExists = (id) => User.exists({ _id: id });

export const removeCommentFromUser = (userId, commentId) => User.findByIdAndUpdate(userId, { $pull: { comments: commentId } })

export const addCommentToUser = (userId, commentId) => User.findByIdAndUpdate(userId, { $push: { comments: commentId } })

export const userHasComment = (userId, commentId) => User.exists({ _id: userId, comments: commentId });