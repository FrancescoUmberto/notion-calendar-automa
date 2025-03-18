const userModel = require("../Models/User").userModel;

async function getUserByEmail(email) {
  try {
    const user = await userModel.findOne({ email: email });
    return user;
  } catch (error) {
    console.log(error);
  }
}

async function addUser(user, token) {
  try {
    const newUser = new userModel({
      email: user,
      notion_database: null,
      google_calendar: null,
      scan: false,
      calendar: null,
      token: JSON.stringify(token),
    });

    await newUser.save();
  } catch (error) {
    console.log(error);
  }
}

async function getUsers() {
  try {
    const users = await userModel.find();
    return users;
  } catch (error) {
    console.log(error);
  }
}

module.exports = { getUserByEmail, addUser, getUsers };
