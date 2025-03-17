import User from "../models/user.model.js";
import mongoose from "mongoose";
import {comparePassword, hashPassword} from "../services/auth.service.js";
import fs from 'fs';
import path from 'path';

// only use transactions when changing multiple documents.
// rather use findOneAndUpdate

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
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
    const isAdmin = req.user.role.toLowerCase() === 'admin'
    
    if (!isAdmin && !isOwnProfile) {
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
  try{
    const { email, currentPassword, newPassword, confirmPassword } = req.body;

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    const user = await User.findOne({ email });
    if (!user){
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch){
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = await hashPassword(newPassword);
    user.mustChangePassword = false;

    await user.save();

    res.json({ message: "Password changed successfully. You can now log in." });
  }catch(error){
    res.status(500).json({message: 'Failed to change password', error})
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