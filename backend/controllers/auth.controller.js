import { sendEmail } from "../services/email.service.js";
import {hashPassword, comparePassword, generatePassword} from "../services/auth.service.js";
import { generateToken, blacklistToken } from "../services/jwt.service.js";
import User from "../models/user.model.js";
import {ALLOWED_DOMAIN} from "../config/env.js";

// Register new user
export const registerUser = async (req, res) => {
    try {
        const { email, role } = req.body;
        const isAdminCreation = req.headers['x-admin-creation'] === 'true';
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        if (!email.endsWith(ALLOWED_DOMAIN)) {
            return res.status(400).json({ message: "Only company emails are allowed" });
        }

        // Generate password for all users
        const userPassword = generatePassword();
        const hashedPassword = await hashPassword(userPassword);

        // Create new user with hashed password
        const newUser = new User({
            ...req.body,
            password: hashedPassword,
            mustChangePassword: true, // All users must change their password on first login
            // For admin creation, use the provided role; for self-registration, always use 'lecturer'
            role: isAdminCreation ? (role || 'lecturer') : 'lecturer'
        });
        
        await newUser.save();

        // Send email with generated password to all users
        await sendEmail(email, userPassword);

        res.status(201).json({ 
            message: "User successfully created"
        });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Registration failed", error: err.message });
    }
};

// Login user with email/username and password
export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        console.log('Login attempt with identifier:', identifier);
        
        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        }).select('+email +username +role +password +mustChangePassword');
        
        console.log('User found:', user ? {
            id: user._id,
            email: user.email,
            username: user.username,
            mustChangePassword: user.mustChangePassword
        } : 'No user');
        
        // Return error if user not found
        if (!user) {
            console.log('User not found for identifier:', identifier);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if password matches
        const isPasswordValid = await comparePassword(password, user.password);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('Invalid password for user:', identifier);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // if user need to change passwort
        if (user.mustChangePassword === true) {
            console.log('User must change password:', user.email);
            return res.status(403).json({ 
                message: "User needs to change default password",
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    mustChangePassword: true
                }
            });
        }
        
        // Generate JWT token for authentication
        const token = generateToken(user);
        console.log('Login successful for:', user.email);
        
        // Return success with user data and token
        res.status(200).json({ 
            message: "Successfully logged in",
            token: token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                mustChangePassword: false
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Login failed" });
    }
};

// Logout user and invalidate token
export const logout = async (req, res) => {
    try {
        // Get token from auth header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(400).json({ message: "No token provided" });
        }

        // Add token to blacklist
        await blacklistToken(token);

        res.status(200).json({ 
            message: "Successfully logged out"
        });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Logout failed" });
    }
};

// Reset password for user
export const resetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate new password
        const newPassword = generatePassword();
        const hashedPassword = await hashPassword(newPassword);

        // Update user's password and set mustChangePassword flag
        user.password = hashedPassword;
        user.mustChangePassword = true;
        await user.save();

        // Send email with new password
        await sendEmail(email, newPassword);

        res.status(200).json({ 
            message: "Password has been reset. Check your email for the new password."
        });
    } catch (err) {
        console.error("Password reset error:", err);
        res.status(500).json({ message: "Password reset failed", error: err.message });
    }
};