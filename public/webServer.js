console.log("[webServer.js] Module loading...");

const express = require("express");
const serverless = require("serverless-http");

const app = express();

app.use((req, res, next) => {
  console.log("EXPRESS RECEIVED:");
  console.log("method:", req.method);
  console.log("url:", req.url);
  console.log("originalUrl:", req.originalUrl);

  next();
});

app.get("/me", function (req, res) {
  console.log("[/me] Handler reached");

  return res.status(200).json({
    message: "hello from /me",
    time: new Date().toISOString()
  });
});

app.use((req, res) => {
  console.log(`[NO MATCH] ${req.method} ${req.originalUrl}`);
  res.status(404).send("No route matched");
});


const expressHandler = serverless(app);

module.exports = async (req, res) => {
  console.log("Incoming URL:", req.url);
  console.log("Query:", req.query);

  if (req.query.path) {
    // overwrite the Lambda event path
    req.path = req.query.path;
    req.url = req.query.path;
  }

  console.log("Before Express URL:", req.url);

  return expressHandler(req, res);
};