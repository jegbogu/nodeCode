require('dotenv').config()
const mongoose = require('mongoose');
console.log(process.env.DB)
function connectDB(){
    try {
        console.log('connecting to db')
        mongoose.connect(process.env.DB)
        console.log('connected')
    } catch (error) {
        console.log(error)
    }
       
    }

    module.exports = connectDB