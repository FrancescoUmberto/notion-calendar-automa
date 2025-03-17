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
      calendar: null,
      token: JSON.stringify(token)
    });

    await newUser.save();
  } catch (error) {
    console.log(error);
  }
}

module.exports = { getUserByEmail, addUser };
