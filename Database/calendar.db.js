const calendarModel = require("../Models/Calendar").calendarModel;
const userModel = require("../Models/User").userModel;

async function getCalendarByID(id) {
  try {
    const calendar = await calendarModel.findOne({ id: id });
    return calendar;
  } catch (err) {
    console.log(err);
  }
}

async function addCalendar(email, notion_database_id) {
  try {
    const newCalendar = new calendarModel({ id: notion_database_id });
    await newCalendar.save();

    const user = await userModel.findOne({ email: email });
    if (!user) return "User not found";

    user.calendar = newCalendar.id;
    await user.save();

    return { state: "success", message: "Calendar added successfully" };
  } catch (err) {
    console.log(err);
    return { state: "error", message: err };
  }
}

module.exports = {
  getCalendarByID,
  addCalendar,
};
