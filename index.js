require("dotenv").config();
const { connectToDatabase } = require("./Database/database");

const authRouter = require("./Routes/auth.routes");
const notionRouter = require("./Routes/notion.routes");
const express = require("express");

const app = express();
// use the endpoint defined in the core/calendar.endpoints.js file
app.use(express.json());
app.use("/", authRouter);
app.use("/notion", notionRouter);

connectToDatabase(() => {
  app.listen(process.env.PORT, () => {
    const status = {
      server: "running",
      url: `http://${process.env.HOST}:${process.env.PORT}`,
      database: "connected",

    };
    console.log(status);
  });
});
