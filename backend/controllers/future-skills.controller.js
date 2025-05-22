import Skill from '../models/skill.model.js'
import mongoose from 'mongoose';
import skillLevelEnum from '../models/enums/skill.level.enum.js';
import * as futureSkillService from '../services/future.skill.service';

// ToDo: move to skill endpoint
export const getAllSkillNames = async (req, res) => {
    try {
        const names = await Skill.find('name');
        res.json(names);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get skill names' });
    }
};

// ToDo: move to skill endpoint
export const getSkillLevels = (req, res) => {
    try {
        const levels = Object.values(skillLevelEnum);
        res.status(200).json(levels);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load skill levels', error: err });
    }
};

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