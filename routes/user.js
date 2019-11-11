const router = require("express").Router();
const server = require("../app");
const User = require("../models/User");
const io = require("socket.io")(server);
const gravatar = require("gravatar");

router.post("/", async (req, res) => {
  try {
    req.body.avatar = gravatar.url(req.body.email, {}, true) + "?d=identicon";
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
    res.status(400).send();
  }
});

module.exports = router;
