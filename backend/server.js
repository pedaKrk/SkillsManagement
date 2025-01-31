const express = require("express")
const mongoose = require('mongoose');
const routes = require('./routes')
const app = express()
const PORT = 3000;

app.use(express.json())
app.use('/api', routes)


mongoose.connect('mongodb+srv://peterkarkulik:R0X7jBjQ3K3aJP4h@skillsmanagement.ylpom.mongodb.net/')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
});
