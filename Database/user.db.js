const userModel = require("../Models/User").userModel;
const calendarModel = require("../Models/Calendar").calendarModel;

async function getUserByEmail(email) {
  try {
    const user = await userModel.findOne({ email: email });
    return user;
  } catch (error) {
    console.log(error);
  }
}

async function addUser(user, token, notion_database_id) {
  try {
    let calendar = await calendarModel.findOne({ id: notion_database_id });

    if (!calendar) {
      calendar = new calendarModel({ id: notion_database_id });
      await calendar.save();
    }

    const newUser = new userModel({
      email: user,
      calendar: notion_database_id,
      token: JSON.stringify(token)
    });

    await newUser.save();
  } catch (error) {
    console.log(error);
  }
}

module.exports = { getUserByEmail, addUser };
