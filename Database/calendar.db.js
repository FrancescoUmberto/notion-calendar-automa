const calendarModel = require("../Models/Calendar").calendarModel;

async function getCalendarByID(id) {
  try {
    const calendar = await calendarModel.findOne({ id: id });
    return calendar;
  } catch (err) {
    console.log(err);
  }
}

async function addCalendar(calendarID) {
  try {
    const newCalendar = new calendarModel(calendarID);
    await newCalendar.save();
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  getCalendarByID,
  addCalendar,
};
