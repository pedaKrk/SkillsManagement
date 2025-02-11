import mongoose from 'mongoose'

const connectToDB = async () => {
    try{
        await mongoose.connect('mongodb+srv://peterkarkulik:R0X7jBjQ3K3aJP4h@skillsmanagement.ylpom.mongodb.net/')
        console.log("Connected to DB")
    }catch(err){
        console.log("Error connecting to DB: ", err)
        throw err
    }
}

export default connectToDB