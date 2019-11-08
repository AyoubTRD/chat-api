const router = require("express").Router();
const server = require("../app");
const User = require("../models/User");
const io = require("socket.io")(server);

const getMessages = async user => {
  const messages = {};
  messages.sent = await user.populate("sent").execPopulate();
  messages.received = await user.populate("received").execPopulate();
  return messages;
};

router.post("/", async (req, res) => {
  try {
    req.body.email = req.body.email.toLowerCase();
    const user = new User(req.body);
    await user.save();
    const token = await user.genAuthToken();
    const userIo = io.of(`/${user._id}`);
    userIo.on("connection", async socket => {
      const messages = await getMessages(user);
      socket.emit("messages", messages);
      io.emit("online user", user.username);
      console.log(user.username, "connected to the socket");
      io.emit("online user", user.username);
    });
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/signin", async (req, res) => {
  try {
    const user = await User.logIn(req.body.email, req.body.password);
    res.send(user);
  } catch (e) {
    res.status(400).send();
  }
});

module.exports = router;
