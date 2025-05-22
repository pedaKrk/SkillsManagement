import * as userRepository from '../repositories/user.repository.js';
import roleEnum from "../models/enums/role.enum.js";
import {NotFoundError} from "../errors/not.found.error.js";
import {ForbiddenError} from "../errors/forbidden.error.js";
import {comparePassword, hashPassword} from "./auth.service.js";
import path from "path";
import fs from "fs";

export const getAllUsers = async () => {
    return userRepository.findAllActiveUsers()
        .select('-password')
        .populate({ path: 'skills.skill', select: 'name description level category parent_id' })
        .populate({ path: 'skills.addedBy', select: 'firstName lastName email' })
        .lean();
}

export const getUserById = async (id) => {
    const user = userRepository.findUserById(id);
    if (!user) {
        return null;
    }

    try {
        return await user.populate([
            { path: 'skills.skill', select: 'name description level category parent_id' },
            { path: 'skills.addedBy', select: 'firstName lastName email' },
            { path: 'futureSkills' },
            { path: 'comments' }
        ]);
    } catch {
        try {
            return await user.populate({
                path: 'skills.skill',
                select: 'name description level category parent_id'
            });
        } catch {
            return user;
        }
    }
}

export const getAllLecturers = async () => {
    return userRepository.findLecturers()
}

export const createUser = async (user) => {
    await userRepository.createUser(user)
}

export const updateUser = async (userId, updateData, currentUser) => {
    try {
        // Skills mapping
        if (updateData.skills && Array.isArray(updateData.skills)) {
            updateData.skills = updateData.skills.map(skillEntry => ({
                skill: skillEntry.skill,
                level: skillEntry.level,
                addedAt: skillEntry.addedAt,
                addedBy: skillEntry.addedBy
            }))
        }

        const isOwnProfile = currentUser.id === userId || currentUser._id === userId
        const userRole = currentUser.role.toLowerCase()
        const isAdmin = userRole === roleEnum.ADMIN.toLowerCase()
        const isCompetenceLeader = userRole === roleEnum.COMPETENCE_LEADER.toLowerCase()

        if (!isAdmin && !isCompetenceLeader && !isOwnProfile) {
            throw new ForbiddenError()
        }

        const updatedUser = await userRepository.updateUserById(userId, updateData)

        if (!updatedUser) {
            throw new NotFoundError()
        }

        return updatedUser
    } catch (error) {
        throw error
    }
}

export const deleteUser = async (id) => {
    const result = await userRepository.deleteUserById(id)
    if(!result){
        throw new NotFoundError()
    }

    return result
}

export const changePassword = async (email, currentPassword, newPassword, confirmPassword) => {
    try {
        if (newPassword !== confirmPassword) {
            console.log('Passwords do not match');
            throw new Error("Passwords do not match");
        }

        console.log('Looking for user with email:', email);
        const user = await userRepository.findUserByEmail(email);

        if (!user) {
            throw new NotFoundError()
        }

        console.log('User found:', {
            id: user._id,
            email: user.email,
            mustChangePassword: user.mustChangePassword
        });

        // passwort controll
        if (!user.mustChangePassword) {
            console.log('Verifying current password for user:', email);
            const isMatch = await comparePassword(currentPassword, user.password);
            if (!isMatch) {
                console.log('Current password verification failed');
                throw new Error('Password verification failed');
            }
            console.log('Current password verified successfully');
        } else {
            console.log('Skipping password verification due to mustChangePassword flag');
        }

        console.log('Hashing new password...');
        const hashedPassword = await hashPassword(newPassword);

        console.log('Updating user password and mustChangePassword flag...');
        const updatedUser = await userRepository.updateUserPassword(user.id, hashedPassword);

        if (!updatedUser) {
            console.log('Failed to update user');
            throw new Error('Failed to update user');
        }

        console.log('Password changed successfully for user:', {
            id: updatedUser._id,
            email: updatedUser.email,
            mustChangePassword: updatedUser.mustChangePassword
        });
    }
    catch (error) {
        throw error;
    }
}

export const getInactiveUsers = async () => {
    try {
        return await userRepository.findAllInactiveUsers()
    }
    catch (error) {
        throw error
    }
}

export const getInactiveUserCount = async () => {
    try{
        return await userRepository.countAllInactiveUsers()
    }
    catch(error){
        throw error
    }
}

export const activateUser = async (id) => {
    try {
        const user = userRepository.findUserById(id)
        if (!user) {
            throw new NotFoundError()
        }

        return await userRepository.activateUserById(id)
    }
    catch (error){
        throw error
    }
}

export const deactivateUser = async (id) => {
    try {
        const user = userRepository.findUserById(id)
        if (!user) {
            throw new NotFoundError()
        }

        return await userRepository.deactivateUserById(id)
    }
    catch (error){
        throw error
    }
}

export const getUserStatus = async (id) => {
    try {
        const user = await userRepository.findUserStatusById(id)
        if(!user) {
            throw new NotFoundError()
        }
        return user.isActive
    }
    catch (error){
        throw error
    }
}

export const uploadProfileImage = async (id, file) => {
    try {
        const user = await userRepository.findUserById(id)
        if (!user) {
            throw new NotFoundError()
        }

        if (user.profileImageUrl) {
            const oldImagePath = path.join(process.cwd(), user.profileImageUrl.replace(/^\//, ''));
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        const profileImageUrl = `/uploads/${file.filename}`;
        console.log('Speichere Profilbild-URL:', profileImageUrl);
        console.log('Vollständiger Dateipfad:', path.join(process.cwd(), profileImageUrl.replace(/^\//, '')));

        return await userRepository.updateUserProfileImage(id, profileImageUrl);
    }
    catch (error) {
        throw error
    }
}

export const removeProfileImage = async (id) => {
    try {
        const user = await userRepository.findUserById(id)
        if (!user) {
            throw new NotFoundError()
        }
        if(!user.profileImageUrl){
            throw new Error('User does not have a profile picture');
        }

        const imagePath = path.join(process.cwd(), user.profileImageUrl.replace(/^\//, ''));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        return await userRepository.updateUserProfileImage(id, undefined);
    }
    catch (error) {
        throw error
    }
}
