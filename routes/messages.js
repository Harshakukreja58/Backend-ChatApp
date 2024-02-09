const express = require("express");
const GlobalMessage = require("../models/GlobalMessage");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Message = require("../models/Messages");
const Conversation = require("../models/Conversation");

const router = express.Router();

let jwtUser;

router.use(async (req, res, next) => {
  let token = req.headers.auth;

  if (!token) {
    return res.status(400).json("Unauthorized");
  }

  jwtUser = await jwt.verify(token.split(" ")[1], process.env.SECRET_JWT);
  if (!jwtUser) {
    return res.status(400).json("Unthorized");
  } else {
    next();
  }
});

router.post("/global", async (req, res) => {
  let message = new GlobalMessage({
    from: jwtUser.id,
    body: req.body.message,
  });
  req.io.sockets.emit("messages", req.body.message);
  let response = await message.save();
  res.send(response);
});

router.get("/globalMessages", async (req, res) => {
  // let messages= await GlobalMessage.find();
  // res.send(messages);

  let messages = await GlobalMessage.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "from",
        foreignField: "_id",
        as: "userObj",
      },
    },
  ]).project({
    "userObj.password": 0,
    "userObj.date": 0,
    "userObj.__v": 0,
    __v: 0,
  });

  res.send(messages);
});

router.post("/personal", async (req, res) => {
  let from = new mongoose.Types.ObjectId(jwtUser.id);
  let to = new mongoose.Types.ObjectId(req.body.sender);

  let conversation = await Conversation.findOneAndUpdate(
    {
      recipents: {
        $all: [{ $elemMatch: { $eq: from } }, { $elemMatch: { $eq: to } }],
      },
    },
    {
      recipents: [from, to],
      lastMessage: req.body.message,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  let message = new Message({
    conversation: conversation._id,
    from: from,
    to: to,
    body: req.body.message,
  });
  req.io.sockets.emit("messages", req.body.message);
  let messageData = await message.save();
  res.send(messageData);
});

router.get("/conversationList", async (req, res) => {
  let from = new mongoose.Types.ObjectId(jwtUser.id);
  let conversationList = await Conversation.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "recipients",
        foreignField: "_id",
        as: "recipientObj",
      },
    },
  ])
    .match({
      recipents: { $all: [{ $elemMatch: { $eq: from } }] },
    })
    .project({
      "recipientObj.password": 0,
      "recipientObj.__v": 0,
      "recipientObj.date": 0,
    })

    .exec();
  res.send(conversationList);
});

router.get("/conversationByUser/query", async (req, res) => {
  let user1 = new mongoose.Types.ObjectId(jwtUser.id);
  let user2 = new mongoose.Types.ObjectId(req.query.userId);
  let conversationList = await Message.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "from",
        foreignField: "_id",
        as: "fromObj",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "to",
        foreignField: "_id",
        as: "toObj",
      },
    },
  ])
    .match({
      $or: [
        { $and: [{ to: user1 }, { from: user2 }] },
        { $and: [{ to: user2 }, { from: user1 }] },
      ],
    })
    .project({
      "toObj.password": 0,
      "toObj.__v": 0,
      "toObj.date": 0,
      "fromObj.password": 0,
      "fromObj.__v": 0,
      "fromObj.date": 0,
    })
    .exec();
  res.send(conversationList);
});

module.exports = router;
