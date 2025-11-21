import mongoose from 'mongoose'
import {DB_URI} from "../config/env.js";
import logger from "../config/logger.js";

const connectToDB = async () => {
    try{
        await mongoose.connect(DB_URI)
        logger.info("Connected to DB")
    }catch(err){
        logger.error("Error connecting to DB:", err)
        throw err
    }
}

export default connectToDB