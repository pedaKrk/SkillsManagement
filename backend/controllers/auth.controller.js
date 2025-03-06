import { sendEmail } from "../services/email.service.js";

export const registerUser = async (req, res) => {
    try{
        const { email } = req.body;
        const password = Math.random().toString(36).slice(-8);

        await sendEmail(email, password)

        res.status(201).json(email)
    }catch(err){
        res.status(500).json({})
    }
}