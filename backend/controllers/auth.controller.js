import { sendEmail } from "../services/email.service.js";
import {hashPassword, comparePassword, generatePassword} from "../services/auth.service.js";
import { generateToken, blacklistToken } from "../services/jwt.service.js";
import User from "../models/user.model.js";

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
            password: hashedPassword
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

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Generate JWT token
        const token = generateToken(user);
        
        res.status(200).json({ 
            message: "Successfully logged in",
            token: token
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Login failed" });
    }
};

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