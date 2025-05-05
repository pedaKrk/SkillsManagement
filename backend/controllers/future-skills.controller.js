import Skill from '../models/skill.model.js'
import FutureSkills from '../models/future-skill.model.js';
import mongoose from 'mongoose';
import skillLevelEnum from '../models/enums/skill.level.enum.js';

export const getAllSkillNames = async (req, res) => {
    try {
        const names = await Skill.find('name');
        res.json(names);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get skill names' });
    }
};


export const getSkillLevels = (req, res) => {
    try {
        const levels = Object.values(skillLevelEnum);
        res.status(200).json(levels);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load skill levels', error: err });
    }
};


// GET all future skills
export const getAllFutureSkills = async (req, res) => {
    try {
        const skills = await FutureSkills.find()
            .populate('lecturer_id', 'title firstName lastName')
            .populate('skill_id', 'name');
        res.status(200).json(skills);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching skills', error: err });
    }
};



// POST create new skill
export const createFutureSkill = async (req, res) => {
    try {
        const newSkill = new FutureSkills(req.body);
        await newSkill.save();
        res.status(201).json(newSkill);
    } catch (err) {
        res.status(400).json({ message: 'Error creating skill', error: err });
    }
};

// PUT update skill by ID
export const updateFutureSkill = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid skill ID' });
    }

    try {
        const updatedSkill = await FutureSkills.findByIdAndUpdate(id, updatedData, { new: true });
        if (!updatedSkill) {
            return res.status(404).json({ message: 'Skill not found' });
        }
        res.status(200).json(updatedSkill);
    } catch (err) {
        res.status(500).json({ message: 'Error updating skill', error: err });
    }
};

// DELETE skill by ID ✅
export const deleteFutureSkill = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid skill ID' });
    }

    try {
        const deletedSkill = await FutureSkills.findByIdAndDelete(id);
        if (!deletedSkill) {
            return res.status(404).json({ message: 'Skill not found' });
        }
        res.status(200).json({ message: 'Skill deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting skill', error: err });
    }
};