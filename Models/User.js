const mongoose = require("mongoose");
const calendarSchema = require("./Calendar").calendarSchema;

class User {
  constructor(email, token, notion_database_id, google_calendar_id, sca, calendar) {
    this.email = email;
    this.token = token;
    this.notion_database = notion_database_id;
    this.google_calendar = google_calendar_id
    this.scan = scan;
    this.calendar = calendar;

  }
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  notion_database: { type: String, required: false },
  google_calendar: { type: String, required: false },
  scan: { type: Boolean, required: false },
  calendar: { type: mongoose.Schema.Types.ObjectId, ref: "Calendar" , required: false, default: null},
  token: { type: Object, required: true },
});

const userModel = mongoose.model("User", userSchema);

module.exports = { userModel, User };
