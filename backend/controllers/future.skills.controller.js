import mongoose from 'mongoose';
import {mailService} from "../services/mail/mail.service.js";
import * as futureSkillService from '../services/future.skill.service.js';
import logger from '../config/logger.js';

export const getAllFutureSkills = async (req, res) => {
    try {
        const skills = await futureSkillService.getAllFutureSkills()
        res.status(200).json(skills);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching skills', error: err });
    }
};

export const createFutureSkill = async (req, res) => {
    try {
        const data = req.body;
        const newSkill = await futureSkillService.createFutureSkill(data);
        res.status(201).json(newSkill);
    } catch (err) {
        res.status(400).json({ message: 'Error creating skill', error: err });
    }
};

export const updateFutureSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid skill ID' });
        }

        const updatedSkill = await futureSkillService.updateFutureSkill(id, updatedData)

        res.status(200).json(updatedSkill);
    } catch (err) {
        res.status(500).json({ message: 'Error updating skill', error: err });
    }
};

export const deleteFutureSkill = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid skill ID' });
        }

        await futureSkillService.deleteFutureSkill(id)

        res.status(200).json({ message: 'Skill deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting skill', error: err });
    }
};

//manage-progress page mail button
export const sendFutureSkillMail = async (req, res) => {
    try {
        const { recipients, subject, message } = req.body;

        if (!recipients || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Recipients, subject, and message are required'
            });
        }

        const result = await mailService.sendEmail(recipients, subject, null, message);

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error in sendFutureSkillMail:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
};

