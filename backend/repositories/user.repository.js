import User from '../models/user.model.js';
import Role from '../models/enums/role.enum.js';

class UserRepository {

    findAllUsers = () => User.find();

    findAllActiveUsers = () => User.find({isActive: true});

    findAllInactiveUsers = () => User.find({isActive: false});

    countAllInactiveUsers = () => User.countDocuments({isActive: false});

    findUserById = (id) => User.findById(id);

    findLecturers = () => User.find({role: Role.LECTURER});

    createUser = (userData) => new User(userData).save();

    updateUserById = (id, userData) => User.findByIdAndUpdate(id, userData, {new: true});

    deleteUserById = (id) => User.findByIdAndDelete(id);

    findUserByEmail = (email) => User.findOne({email});

    updateUserPassword = (id, hashedPassword) =>
        User.findByIdAndUpdate(id, {$set: {password: hashedPassword, mustChangePassword: false}}, {new: true});

    activateUserById = (id) => User.findByIdAndUpdate(id, {isActive: true}, {new: true});

    deactivateUserById = (id) => User.findByIdAndUpdate(id, {isActive: false}, {new: true});

    findUserStatusById = (id) => User.findById(id).select('isActive');

    updateUserProfileImage = (id, profileImageUrl) =>
        User.findByIdAndUpdate(id, {$set: {profileImageUrl}}, {new: true});

    loadCommentsFromUser = (id) => User.findById(id).select('comments');

    findUserSkills = (id) => User.findById(id).select('skills').lean();

    userExists = (id) => User.exists({_id: id});

    removeCommentFromUser = (userId, commentId) => User.findByIdAndUpdate(userId, {$pull: {comments: commentId}})

    addCommentToUser = (userId, commentId) => User.findByIdAndUpdate(userId, {$push: {comments: commentId}})

    userHasComment = (userId, commentId) => User.exists({_id: userId, comments: commentId});
}

export default new UserRepository();