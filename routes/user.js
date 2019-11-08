const router = require("express").Router();
const server = require("../app");
const User = require("../models/User");
const io = require("socket.io")(server);

router.post("/", async (req, res) => {
  try {
    req.body.email = req.body.email.toLowerCase();
    const user = new User(req.body);
    await user.save();
    const token = await user.genAuthToken();
    io.sockets.emit("new user", user);
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { user, token } = await User.logIn(req.body.email, req.body.password);
    io.sockets.emit("online user", user);
    res.send({ user, token });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

module.exports = router;
