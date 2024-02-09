const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");

const bodyParser = require("body-parser");

const users = require("./routes/users");
const messages = require("./routes/messages");

const app = express();
const port = process.env.PORT;
const mongodbURI = process.env.MONGOOSE_URI;
const server = app.listen(port, () => {
  console.log("Server is up on port", port);
});
const socketIo = require("socket.io")(server, { cors: { origin: "*" } });

mongoose
  .connect(mongodbURI)
  .then(() => console.log("mongodb connected successfully"))
  .catch((err) => console.log(err));

app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use(function (req, res, next) {
  req.io = socketIo;
  next();
});

app.use("/users", users);
app.use("/messages", messages);
