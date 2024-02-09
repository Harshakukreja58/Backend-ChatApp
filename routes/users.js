const express = require("express");
const Users = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
// const validateRegisterInput= require('../validation/register');
// const validateLoginInput = require('../validation/login');
//Dummy Api for testing
// router.get('/dummyapi',(req,res)=>{
//     res.send("dummp api working");
// })
router.post("/login", async (req, res) => {
  console.log(req.body);
  if (!req.body.userName) {
    res.status(400).send("Username cannot be empty");
  } else if (!req.body.password) {
    res.status(400).send("password cannot be empty");
  } else {
    //validate from  mongodb
    let user = await Users.findOne({ userName: req.body.userName });
    if (!user) {
      return res.status(400).json("Invalid credentials");
    }
    let isMatch = bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json("Invalid credentials");
    }
    const payload = {
      id: user._id,
      name: req.body.name,
    };
    const token = await jwt.sign(payload, process.env.SECRET_JWT, {
      expiresIn: 31556296,
    });
    console.log(token);
    res.json({
      success: true,
      id: user._id,
      userName: user.userName,
      name: user.name,
      token: token,
    });
  }
});
router.post("/signup", async (req, res) => {
  console.log(req.body);

  if (!req.body.userName) {
    res.status(400).send("Name cannot be empty");
  } else if (!req.body.userName) {
    res.status(400).send("Username cannot be empty");
  } else if (!req.body.password) {
    res.status(400).send("password cannot be empty");
  } else {
    //validate from  mongodb
    let user = await Users.findOne({ userName: req.body.userName });
    if (user) {
      return res.status(400).json("username already exist");
    }
    const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS));
    const hash = await bcrypt.hash(req.body.password, salt);
    // console.log(hash)
    // res.send(hash)
    const newUser = new Users({
      name: req.body.name,
      userName: req.body.userName,
      password: hash,
    });
    req.io.sockets.emit("users", req.body.userName);
    newUser
      .save()
      .then((user) => {
        console.log(user);
        // res.send(user)
        const payload = {
          id: user._id,
          name: req.body.name,
        };
        jwt.sign(
          payload,
          process.env.SECRET_JWT,
          { expiresIn: 31556926 },
          (err, token) => {
            res.json({
              success: true,
              id: user._id,
              userName: user.userName,
              name: user.name,
              token: token,
            });
          }
        );
      })
      .catch((err) => {
        res.send(err);
      });
  }
});
//user list api
router.get("/", async (req, res) => {
  let token = req.headers.auth;
  if (!token) {
    return res.status(400).json("Unauthorized");
  }
  let jwtUser;
  try {
    jwtUser = jwt.verify(token.split(" ")[1], process.env.SECRET_JWT);
  } catch (err) {
    console.log(err);
    return res.status(400).json("Invalid token");
  }

  console.log({ jwtUser });
  if (!jwtUser) {
    return res.status(400).json("Unauthorized");
  }
  let users = await Users.aggregate().project({
    password: 0,
    date: 0,
    __v: 0,
  });
  res.send(users);
});
module.exports = router;
