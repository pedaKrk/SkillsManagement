import { sendEmail } from "../services/email.service.js";
import { hashPassword, comparePassword } from "../services/auth.service.js";
import { generateToken, blacklistToken } from "../services/jwt.service.js";
import User from "../models/user.model.js";

// Register new user
export const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Hash password for security
        const hashedPassword = await hashPassword(password);
        
        // Create new user with default role
        const newUser = new User({
            ...req.body,
            password: hashedPassword,
            role: 'Lecturer' // Default role for new users
        });
        
        await newUser.save();
        
        // Generate authentication token
        const token = generateToken(newUser);
        
        // Send welcome email - pass email and original password
        try {
            await sendEmail(email, password);
        } catch (emailError) {
            console.error("Email sending failed but user was created:", emailError);
            // Continue with registration even if email fails
        }

        res.status(201).json({ 
            message: "User successfully registered",
            token: token
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
                username: user.username
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
        // Extract token from authorization header
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