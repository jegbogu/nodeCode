 
const mongoose = require('mongoose');
 
async function connectDB(){
    try {
        console.log('connecting to db')
      await mongoose.connect('mongodb://127.0.0.1:27017/db')
        console.log('connected')
    } catch (error) {
        console.log(error)
    }
       
    }

    module.exports = connectDB