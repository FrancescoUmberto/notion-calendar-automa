const mongoose = require("mongoose");
const calendarSchema = require("./Calendar").calendarSchema;

class User {
  constructor(email, token) {
    this.email = email;
    this.token = token;
    this.calendar = new Map();
  }
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  token: { type: Object, required: true },
  calendar: { type: Map, of: calendarSchema, default: new Map() },
});

const userModel = mongoose.model("User", userSchema);

module.exports = { User, userModel };
