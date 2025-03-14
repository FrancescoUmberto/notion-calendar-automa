require("dotenv").config();
const { connectToDatabase } = require("./Database/database");
const Auth = require("./core/auth");
const authRouter = require("./Routes/auth.routes");
const express = require("express");
const app = express();
// use the endpoint defined in the core/calendar.endpoints.js file
app.use(express.json());
app.use("/", authRouter);

const auth = new Auth();
notionDatabaseID = process.env.NOTION_DATABASE_ID;

connectToDatabase(() => {
  app.listen(3000, () => {
    auth.authorizeGoogleAPI().then(() => {
      const status = {
        "database": "connected",
        "googleAPI": "validated",
        "server": "running",
      };
      console.log(status);
    });
  });
});
