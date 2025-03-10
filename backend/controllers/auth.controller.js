import { sendEmail } from "../services/email.service.js";
import { hashPassword, comparePassword } from "../services/auth.service.js";
import { generateToken, blacklistToken } from "../services/jwt.service.js";
import User from "../models/user.model.js";

export const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);
        
        // Create new user with hashed password
        const newUser = new User({
            ...req.body,
            password: hashedPassword
        });
        
        await newUser.save();
        
        // Generate JWT token
        const token = generateToken(newUser);
        
        // Send confirmation email
        await sendEmail(email, "Registration successful");

        res.status(201).json({ 
            message: "User successfully registered",
            token: token
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
        // Token aus dem Authorization Header extrahieren
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(400).json({ message: "No token provided" });
        }

        // Token zur Blacklist hinzufügen
        await blacklistToken(token);

        res.status(200).json({ 
            message: "Successfully logged out"
        });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Logout failed" });
    }
};