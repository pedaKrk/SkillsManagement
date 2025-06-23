import mongoose from "mongoose";
import roleEnum from "../models/enums/role.enum.js";
import * as userService from "../services/user.service.js";

export const getAllUsers = async (req, res) => {
  try {
    console.info("Get all users");
    const users = await userService.getAllUsers();

    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ 
      message: 'Failed to get users', 
      error: error.message 
    });
  }
}

export const getUserById = async (req, res) => {
  try {
    console.info("Get user by id");
    const { id } = req.params
    
    const basicUser = await userService.getUserById(id)
    if (!basicUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    try {
      const user = await userService.getUserById(id)

      res.status(200).json(user)
    } catch (populateError) {
      console.error('Error populating user references:', populateError)
      
      try {
        const userWithSkills = await userService.getUserById(id)
        res.status(200).json(userWithSkills)
      } catch (skillsError) {
        console.error('Error populating skills:', skillsError)
        
        res.status(200).json(basicUser)
      }
    }
  } catch (error) {
    console.error('Error in getUserById:', error)
    res.status(500).json({ message: 'Failed to get user', error })
  }
}

export const getAllLecturers = async (req, res) => {
  try {
    console.info("Get all lecturers");
    const lecturers = await userService.getAllLecturers()

    res.status(200).json(lecturers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching lecturers', error: err });
  }
};

export const createUser = async (req, res) => {
  try {
    const userData = req.body

    const newUser = userService.createUser(userData)

    res.status(201).json(newUser)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user', error })
  }
}

export const updateUser = async (req, res) => {
  try {
    console.info("Update user");
    const { id } = req.params;
    const userData = req.body;
    
    console.log('[updateUser controller] Inspecting req.user:', req.user);

    const updatedUser = await userService.updateUser(id, userData, req.user);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in updateUser controller:', error);
    res.status(500).json({ 
        message: 'Failed to update user', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export const deleteUser = async (req, res) => {
  try {
    console.info("Delete user");
    const { id } = req.params
    const result = await userService.deleteUser(id)
    if (!result) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error })
  }
}

export const changePassword = async (req, res) => {
  try {
    console.info("Change password");
    const { email, currentPassword, newPassword, confirmPassword } = req.body;
    console.log('Password change request received:', { 
      email, 
      currentPassword: '***', 
      newPassword: '***', 
      confirmPassword: '***' 
    });

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      console.log('Missing required fields:', { 
        hasEmail: !!email, 
        hasCurrentPassword: !!currentPassword, 
        hasNewPassword: !!newPassword, 
        hasConfirmPassword: !!confirmPassword 
      });
      return res.status(400).json({ error: "Alle Felder müssen ausgefüllt werden" });
    }

    await userService.changePassword(email, currentPassword, newPassword, confirmPassword)

    res.json({ 
      message: "Passwort wurde erfolgreich geändert. Sie können sich jetzt anmelden.",
      success: true
    });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({ 
      message: 'Fehler beim Ändern des Passworts', 
      error: error.message,
      success: false
    });
  }
}

// ToDo: Error regarding ProfileImage, add and del
export const uploadProfileImage = async (req, res) => {
  try {
    console.info("Upload profile image");
    const { id } = req.params;
    const file = req.file;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    if (file) {
      return res.status(400).json({ message: 'Keine Datei hochgeladen' });
    }
    
    const updatedUser = await userService.uploadProfileImage(id, file)
    
    res.status(200).json({
      message: 'Profilbild erfolgreich hochgeladen',
      user: updatedUser
    });
  } catch (error) {
    console.error('Fehler beim Hochladen des Profilbilds:', error);
    res.status(500).json({
      message: 'Fehler beim Hochladen des Profilbilds',
      error: error.message
    });
  }
};

export const removeProfileImage = async (req, res) => {
  try {
    console.info("remove profile image");
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    const updatedUser = userService.removeProfileImage(id)
    
    res.status(200).json({
      message: 'Profilbild erfolgreich entfernt',
      user: updatedUser
    });
  } catch (error) {
    console.error('Fehler beim Entfernen des Profilbilds:', error);
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
    console.log("Get Inactive Users");
    const inactiveUsers = await userService.getInactiveUsers();
    
    res.status(200).json(inactiveUsers);
  } catch (error) {
    console.error('Error getting inactive users:', error);
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
    console.info('Get inactive UsersCount');
    const count = await userService.getInactiveUserCount();
    res.status(200).json(count);
  } catch (error) {
    console.error('Error getting inactive users count:', error);
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
    console.info("Activate User");
    const { id } = req.params;
    
    await userService.activateUser(id);
    
    res.status(200).json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Error activating user:', error);
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
    console.info('Deactivate user');
    const { id } = req.params;
    
    await userService.deactivateUser(id);
    
    res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
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
    console.info("get user status")
    const { id } = req.params;
    
    const isActive = userService.getUserStatus(id);
    
    res.status(200).json({ isActive });
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({ 
      message: 'Failed to get user status', 
      error: error.message 
    });
  }
}