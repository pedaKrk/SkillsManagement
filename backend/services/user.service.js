import roleEnum from "../models/enums/role.enum.js";
import {NotFoundError} from "../errors/not.found.error.js";
import {ForbiddenError} from "../errors/forbidden.error.js";
import {comparePassword, hashPassword} from "./auth.service.js";
import path from "path";
import fs from "fs";
import UserRepository from "../repositories/user.repository.js";

export const getAllUsers = async () => {
    return UserRepository.findAllActiveUsers()
        .select('-password')
        .populate({ path: 'skills.skill', select: 'name description level category parent_id' })
        .populate({ path: 'skills.levelHistory.changedBy', select: 'firstName lastName email' })
        .lean();
}

export const getUserById = async (id) => {
    const user = await UserRepository.findUserById(id);
    if (!user) {
        return null;
    }

    await user.populate([
        {
            path: 'skills.skill',
            select: 'name description level category parent_id'
        },
        {
            path: 'skills.levelHistory.changedBy',
            select: 'firstName lastName email'
        },
        {
            path: 'futureSkills',
            populate: {
                path: 'lecturer_id',
                select: 'firstName lastName'
            }
        },
        {
            path: 'comments',
            populate: {
                path: 'author',
                select: 'firstName lastName'
            }
        }
    ]);

    return user;
}

export const getAllLecturers = async () => {
    return await UserRepository.findLecturers()
}

export const createUser = async (user) => {
    return await UserRepository.createUser(user)
}

export const updateUser = async (userId, updateData, currentUser) => {
    try {
        const currentUserId = currentUser?.id || currentUser?._id;
        if (!currentUserId) {
            throw new Error("Current user ID is missing, authentication issue.");
        }

        const isOwnProfile = currentUserId.toString() === userId;
        const userRole = currentUser.role.toLowerCase();
        const isAdmin = userRole === roleEnum.ADMIN.toLowerCase();
        const isCompetenceLeader = userRole === roleEnum.COMPETENCE_LEADER.toLowerCase();

        if (!isAdmin && !isCompetenceLeader && !isOwnProfile) {
            throw new ForbiddenError();
        }

        if (updateData.skills && Array.isArray(updateData.skills)) {
            const user = await UserRepository.findUserById(userId);
            if (!user) {
                throw new NotFoundError();
            }

            const existingSkillsMap = new Map(user.skills.map(s => [s.skill.toString(), s]));
            const newSkillsArray = [];

            for (const skillEntry of updateData.skills) {
                const skillId = skillEntry.skill;
                const newLevel = skillEntry.level;
                const existingSkill = existingSkillsMap.get(skillId);

                if (existingSkill) {
                    const latestHistoryEntry = existingSkill.levelHistory[existingSkill.levelHistory.length - 1];
                    if (!latestHistoryEntry || latestHistoryEntry.level !== newLevel) {
                        existingSkill.levelHistory.push({
                            level: newLevel,
                            changedBy: currentUserId
                        });
                    }
                    newSkillsArray.push(existingSkill);
                } else {
                    newSkillsArray.push({
                        skill: skillId,
                        levelHistory: [{
                            level: newLevel,
                            changedBy: currentUserId
                        }]
                    });
                }
            }

            user.skills = newSkillsArray;

            await user.save();
            delete updateData.skills; 
        }

        const updatedUser = await UserRepository.updateUserById(userId, updateData);

        if (!updatedUser) {
            throw new NotFoundError();
        }
        return updatedUser;
    } catch (error) {
        console.error('[updateUser] Error caught in service:', error);
        throw error;
    }
}

export const deleteUser = async (id) => {
    const result = await UserRepository.deleteUserById(id)
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
        const user = await UserRepository.findUserByEmail(email);

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
        const updatedUser = await UserRepository.updateUserPassword(user.id, hashedPassword);

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
        return await UserRepository.findAllInactiveUsers()
    }
    catch (error) {
        throw error
    }
}

export const getInactiveUserCount = async () => {
    try{
        return await UserRepository.countAllInactiveUsers()
    }
    catch(error){
        throw error
    }
}

export const activateUser = async (id) => {
    try {
        const user = UserRepository.findUserById(id)
        if (!user) {
            throw new NotFoundError()
        }

        return await UserRepository.activateUserById(id)
    }
    catch (error){
        throw error
    }
}

export const deactivateUser = async (id) => {
    try {
        const user = UserRepository.findUserById(id)
        if (!user) {
            throw new NotFoundError()
        }

        return await UserRepository.deactivateUserById(id)
    }
    catch (error){
        throw error
    }
}

export const getUserStatus = async (id) => {
    try {
        const user = await UserRepository.findUserStatusById(id)
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
        const user = await UserRepository.findUserById(id)
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

        return await UserRepository.updateUserProfileImage(id, profileImageUrl);
    }
    catch (error) {
        throw error
    }
}

export const removeProfileImage = async (id) => {
    try {
        const user = await UserRepository.findUserById(id)
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

        return await UserRepository.updateUserProfileImage(id, undefined);
    }
    catch (error) {
        throw error
    }
}
