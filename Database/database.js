const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

function connectToDatabase(callback) {
  mongoose
    .connect(connectionString)
    .then(() => {
      callback();
    })
    .catch((err) => {
      console.log(err);
      const timestamp = new Date().toISOString();
      const errorMessage = `Timestamp: ${timestamp}\nError: ${err.message}\nStack: ${err.stack}`;
      fs.writeFileSync(`${process.env.LOG_PATH}${timestamp}_crash.log`, errorMessage);
    });
}

module.exports = {
  connectToDatabase,
};
