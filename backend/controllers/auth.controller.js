import { sendEmail } from "../services/email.service.js";
import {hashPassword, comparePassword, generatePassword} from "../services/auth.service.js";
import { generateToken, blacklistToken } from "../services/jwt.service.js";
import User from "../models/user.model.js";

// Register new user
export const registerUser = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const generatedPassword = generatePassword();
        const hashedPassword = await hashPassword(generatedPassword);

        // Create new user with hashed password
        const newUser = new User({
            ...req.body,
            password: hashedPassword,
            mustChangePassword: true,
            role: 'Lecturer' // Default role for new users
        });
        
        await newUser.save();

        // Send email with generated password
        await sendEmail(email, generatedPassword);

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
        });
        console.log('User found:', !!user);
        
        // Return error if user not found
        if (!user) {
            console.log('User not found for identifier:', identifier);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if(user.mustChangePassword === true) {
            return res.status(403).json({ message: "User needs to change default password" });
        }
        
        // Check if password matches
        const isPasswordValid = await comparePassword(password, user.password);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('Invalid password for user:', identifier);
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Generate JWT token for authentication
        const token = generateToken(user);
        console.log('Login successful for:', identifier);
        
        // Return success with user data and token
        res.status(200).json({ 
            message: "Successfully logged in",
            token: token,
            user: {
                email: user.email,
                username: user.username,
                role: user.role
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