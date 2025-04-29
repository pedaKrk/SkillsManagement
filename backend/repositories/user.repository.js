import User from '../models/user.model.js';

export const findAllActiveUsers = () => {
    return User.find({ isActive: true })
        .select('-password')
        .populate('skills')
        .lean();
};

export const findAllInactiveUsers = () => {
    return User.find({ isActive: false }).select('-password').lean();
};

export const findUserById = (id) => {
    return User.findById(id);
};

export const populateUserDetails = (id) => {
    return User.findById(id)
        .populate('skills')
        .populate('futureSkills')
        .populate('comments');
};

export const populateUserSkillsOnly = (id) => {
    return User.findById(id).populate('skills');
};

export const createUser = (userData) => {
    const user = new User(userData);
    return user.save();
};

export const updateUserById = (id, data) => {
    return User.findByIdAndUpdate(id, data, { new: true });
};

export const deleteUserById = (id) => {
    return User.findByIdAndDelete(id);
};

export const findUserByEmail = (email) => {
    return User.findOne({ email });
};

export const updatePasswordById = (id, hashedPassword) => {
    return User.findByIdAndUpdate(
        id,
        { password: hashedPassword, mustChangePassword: false },
        { new: true }
    );
};

export const updateProfileImage = async (user, profileImageUrl) => {
    user.profileImageUrl = profileImageUrl;
    return user.save();
};

export const removeProfileImage = async (user) => {
    user.profileImageUrl = undefined;
    return user.save();
};

export const userRepository = {
    findUserById,
    findUserByEmail,
    populateUserDetails,
    populateUserSkillsOnly,
    createUser,
    updateUserById,
    deleteUserById,
    findAllInactiveUsers,
    findAllActiveUsers,
    updatePasswordById,
    updateProfileImage,
    removeProfileImage,
}