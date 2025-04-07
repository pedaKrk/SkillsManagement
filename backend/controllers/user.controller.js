import User from "../models/user.model.js";
import mongoose from "mongoose";
import {comparePassword, hashPassword} from "../services/auth.service.js";
import fs from 'fs';
import path from 'path';
import roleEnum from "../models/enums/role.enum.js";

// only use transactions when changing multiple documents.
// rather use findOneAndUpdate

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .populate('skills')
      .lean();
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
    const { id } = req.params
    
    const basicUser = await User.findById(id)
    if (!basicUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    try {
      const user = await User.findById(id)
        .populate('skills')
        .populate('futureSkills')
        .populate('comments')
      
      res.status(200).json(user)
    } catch (populateError) {
      console.error('Error populating user references:', populateError)
      
      try {
        const userWithSkills = await User.findById(id).populate('skills')
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
    
    const isOwnProfile = req.user.id === id || req.user._id === id
    const userRole = req.user.role.toLowerCase()
    const isAdmin = userRole === roleEnum.ADMIN.toLowerCase()
    const isCompetenceLeader = userRole === roleEnum.COMPETENCE_LEADER.toLowerCase()
    
    if (!isAdmin && !isCompetenceLeader && !isOwnProfile) {
      await session.abortTransaction()
      await session.endSession()
      return res.status(403).json({ 
        message: 'Sie haben keine Berechtigung, dieses Benutzerprofil zu bearbeiten.' 
      })
    }

    const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true })

    if (!updatedUser) {
      await session.abortTransaction()
      await session.endSession()
      return res.status(404).json({ message: 'User not found' })
    }

    await session.commitTransaction()
    await session.endSession()
    res.status(200).json(updatedUser)
  } catch (error) {
    await session.abortTransaction()
    await session.endSession()
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

export const changePassword = async (req, res) => {
  try {
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

    if (newPassword !== confirmPassword) {
      console.log('Passwords do not match');
      return res.status(400).json({ error: "Die neuen Passwörter stimmen nicht überein" });
    }

    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
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
        return res.status(400).json({ error: "Das aktuelle Passwort ist nicht korrekt" });
      }
      console.log('Current password verified successfully');
    } else {
      console.log('Skipping password verification due to mustChangePassword flag');
    }

    console.log('Hashing new password...');
    const hashedPassword = await hashPassword(newPassword);
    
    // Direkte Aktualisierung mit findOneAndUpdate
    console.log('Updating user password and mustChangePassword flag...');
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          mustChangePassword: false
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      console.log('Failed to update user');
      throw new Error('Failed to update user');
    }

    console.log('Password changed successfully for user:', {
      id: updatedUser._id,
      email: updatedUser.email,
      mustChangePassword: updatedUser.mustChangePassword
    });

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

//upload 
export const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Keine Datei hochgeladen' });
    }
    
    if (user.profileImageUrl) {
      const oldImagePath = path.join(process.cwd(), user.profileImageUrl.replace(/^\//, ''));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    const profileImageUrl = `/uploads/${req.file.filename}`;
    console.log('Speichere Profilbild-URL:', profileImageUrl);
    console.log('Vollständiger Dateipfad:', path.join(process.cwd(), profileImageUrl.replace(/^\//, '')));
    
    user.profileImageUrl = profileImageUrl;
    await user.save();
    
    res.status(200).json({
      message: 'Profilbild erfolgreich hochgeladen',
      user: {
        ...user.toObject(),
        password: undefined
      }
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    if (!user.profileImageUrl) {
      return res.status(400).json({ message: 'Benutzer hat kein Profilbild' });
    }

    const imagePath = path.join(process.cwd(), user.profileImageUrl.replace(/^\//, ''));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    user.profileImageUrl = undefined;
    await user.save();
    
    res.status(200).json({
      message: 'Profilbild erfolgreich entfernt',
      user: {
        ...user.toObject(),
        password: undefined
      }
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
    const inactiveUsers = await User.find({ isActive: false })
      .select('-password')
      .lean();
    
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
    const count = await User.countDocuments({ isActive: false });
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
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isActive = true;
    await user.save();
    
    res.status(200).json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ 
      message: 'Failed to activate user', 
      error: error.message 
    });
  }
}