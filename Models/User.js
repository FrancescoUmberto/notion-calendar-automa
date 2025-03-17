const mongoose = require("mongoose");
const calendarSchema = require("./Calendar").calendarSchema;

class User {
  constructor(email, token, calendarID) {
    this.email = email;
    this.token = token;
    this.calendar = calendarID;
  }
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  calendar: { type: String, required: false },
  token: { type: Object, required: true }
});

const userModel = mongoose.model("User", userSchema);

module.exports = { userModel };
