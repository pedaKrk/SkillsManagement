import mongoose from "mongoose";
import roleEnum from "../models/enums/role.enum.js";
import * as userService from "../services/user.service.js";
import logger from "../config/logger.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({ 
      message: 'Failed to get users', 
      error: error.message 
    });
  }
}

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    
    const basicUser = await userService.getUserById(id)
    if (!basicUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    try {
      const user = await userService.getUserById(id)

      res.status(200).json(user)
    } catch (populateError) {
      logger.warn('Error populating user references:', populateError)
      
      try {
        const userWithSkills = await userService.getUserById(id)
        res.status(200).json(userWithSkills)
      } catch (skillsError) {
        logger.warn('Error populating skills:', skillsError)
        
        res.status(200).json(basicUser)
      }
    }
  } catch (error) {
    logger.error('Error in getUserById:', error)
    res.status(500).json({ message: 'Failed to get user', error })
  }
}

export const getAllLecturers = async (req, res) => {
  try {
    logger.info("Get all lecturers");
    const lecturers = await userService.getAllLecturers()

    res.status(200).json(lecturers);
  } catch (err) {
    logger.error('Error fetching lecturers:', err);
    res.status(500).json({ message: 'Error fetching lecturers', error: err });
  }
};

export const createUser = async (req, res) => {
  try {
    const userData = req.body

    const newUser = await userService.createUser(userData)
    logger.info(`User created: ${newUser.email} (${newUser._id})`);

    res.status(201).json(newUser)
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error })
  }
}

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    const updatedUser = await userService.updateUser(id, userData, req.user);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`User updated: ${id}`);
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error('Error in updateUser controller:', error);
    res.status(500).json({ 
        message: 'Failed to update user', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export const deleteUser = async (req, res) => {
  try {
    logger.info("Delete user:", req.params.id);
    const { id } = req.params
    const result = await userService.deleteUser(id)
    if (!result) {
      return res.status(404).json({ message: 'User not found' })
    }
    logger.info(`User ${id} deleted successfully`);
    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Alle Felder müssen ausgefüllt werden" });
    }

    await userService.changePassword(email, currentPassword, newPassword, confirmPassword)
    logger.info(`Password changed successfully for user: ${email}`);

    res.json({ 
      message: "Passwort wurde erfolgreich geändert. Sie können sich jetzt anmelden.",
      success: true
    });
  } catch (error) {
    logger.error('Error in changePassword:', error);
    res.status(500).json({ 
      message: 'Fehler beim Ändern des Passworts', 
      error: error.message,
      success: false
    });
  }
}

export const uploadProfileImage = async (req, res) => {
  try {
    logger.info("Upload profile image");
    const { id } = req.params;
    const file = req.file;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Invalid user ID for profile image upload: ${id}`);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    if (!file) {
      logger.warn(`No file provided for profile image upload: ${id}`);
      return res.status(400).json({ message: 'Keine Datei hochgeladen' });
    }
    
    logger.debug('File object:', { filename: file.filename, originalname: file.originalname, path: file.path });
    
    const updatedUser = await userService.uploadProfileImage(id, file);
    logger.info(`Profile image uploaded successfully for user: ${id}`);
    
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error('Fehler beim Hochladen des Profilbilds:', error);
    res.status(500).json({
      message: 'Fehler beim Hochladen des Profilbilds',
      error: error.message
    });
  }
};

export const removeProfileImage = async (req, res) => {
  try {
    logger.info("Remove profile image");
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Invalid user ID for profile image removal: ${id}`);
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    const updatedUser = await userService.removeProfileImage(id);
    logger.info(`Profile image removed successfully for user: ${id}`);
    
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error('Fehler beim Entfernen des Profilbilds:', error);
    res.status(500).json({
      message: 'Fehler beim Entfernen des Profilbilds',
      error: error.message
    });
  }
};

/**
 * Get all inactive users
 */
export const getInactiveUsers = async (req, res) => {
  try {
    const inactiveUsers = await userService.getInactiveUsers();
    
    res.status(200).json(inactiveUsers);
  } catch (error) {
    logger.error('Error getting inactive users:', error);
    res.status(500).json({ 
      message: 'Failed to get inactive users', 
      error: error.message 
    });
  }
}

/**
 * Get count of inactive users
 */
export const getInactiveUsersCount = async (req, res) => {
  try {
    const count = await userService.getInactiveUserCount();
    res.status(200).json(count);
  } catch (error) {
    logger.error('Error getting inactive users count:', error);
    res.status(500).json({ 
      message: 'Failed to get inactive users count', 
      error: error.message 
    });
  }
}

/**
 * Activate a user
 */
export const activateUser = async (req, res) => {
  try {
    logger.info("Activate User:", req.params.id);
    const { id } = req.params;
    
    await userService.activateUser(id);
    
    res.status(200).json({ message: 'User activated successfully' });
  } catch (error) {
    logger.error('Error activating user:', error);
    res.status(500).json({ 
      message: 'Failed to activate user', 
      error: error.message 
    });
  }
}

/**
 * Deactivate a user
 */
export const deactivateUser = async (req, res) => {
  try {
    logger.info('Deactivate user:', req.params.id);
    const { id } = req.params;
    
    await userService.deactivateUser(id);
    
    res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    logger.error('Error deactivating user:', error);
    res.status(500).json({ 
      message: 'Failed to deactivate user', 
      error: error.message 
    });
  }
}

/**
 * Get user status
 */
export const getUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const isActive = await userService.getUserStatus(id);
    
    res.status(200).json({ isActive });
  } catch (error) {
    logger.error('Error getting user status:', error);
    res.status(500).json({ 
      message: 'Failed to get user status', 
      error: error.message 
    });
  }
}