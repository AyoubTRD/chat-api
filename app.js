const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const server = app.listen(
  port,
  console.log.bind("", `The server is running on port ${port}`)
);
const cors = require("cors");

const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://ayoub:ayoub@cluster0-jwsvd.mongodb.net/chat?retryWrites=true&w=majority",
    { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connected successfully to the database"))
  .catch(err =>
    console.log(
      "an error occured while connecting to the database: " + err.message
    )
  );

app.use(express.json());
app.use(cors());

const userRoutes = require("./routes/user");

app.use("/users", userRoutes);

const sockets = {};

const io = require("socket.io")(server);
const User = require("./models/User");
const Message = require("./models/Message");

const jwt = require("jsonwebtoken");

const authenticate = async token => {
  try {
    const decode = jwt.verify(token, "auth");
    const user = await User.findOne({ _id: decode._id, "tokens.token": token });
    user.online = true;
    await user.save();
    return user;
  } catch (e) {}
};

io.on("connection", async socket => {
  try {
    const { token } = socket.handshake.query;
    const user = await authenticate(token);

    sockets[user._id] = socket;

    socket.broadcast.emit("online user", user);

    socket.emit("ready");

    const users = await User.find({});
    const usersExceptMe = users.filter(usr => {
      return user._id.toString() !== usr._id.toString();
    });

    socket.emit("users", usersExceptMe);

    socket.on("send message", async (msg, cb = function() {}) => {
      try {
        console.log("sending a message");
        msg = { ...msg, from: user._id };
        console.log(msg);
        const message = new Message(msg);
        await message.save();
        sockets[msg.to].emit("received message", message);
        cb(undefined, message);
      } catch (e) {
        cb(e);
      }
    });

    socket.on("request messages", async userId => {
      console.log("sending messages");
      await user.populate("sent").execPopulate();
      await user.populate("received").execPopulate();
      const sent = user.sent.filter(
        msg => msg.to.toString() === userId.toString()
      );
      const received = user.received.filter(
        msg => msg.from.toString() === userId.toString()
      );
      socket.emit("messages", { sent, received });
    });

    socket.on("greet", greet => console.log(greet));

    socket.on("disconnect", async () => {
      sockets[token] = undefined;
      user.online = false;
      await user.save();
      socket.broadcast.emit("offline user", user);
    });

    console.log("a new connection has been made by:", user.username);
  } catch (e) {
    console.log(e.message);
  }
});

module.exports = server;
