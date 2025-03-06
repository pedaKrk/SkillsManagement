import mongoose from 'mongoose'
import {DB_URI} from "../config/env.js";

const connectToDB = async () => {
    try{
        await mongoose.connect(DB_URI)
        console.log("Connected to DB")
    }catch(err){
        console.log("Error connecting to DB: ", err)
        throw err
    }
}

export default connectToDB