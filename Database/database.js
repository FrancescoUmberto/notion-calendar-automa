const mongoose = require('mongoose');

require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

// Funzione che si connette al database da mongoose e chiama la callback
function connectToDatabase(callback){
    mongoose.connect(connectionString).then(()=>{
        callback();
    }).catch((err) => {
        console.log(err);
    });
}




module.exports = {
    connectToDatabase
};