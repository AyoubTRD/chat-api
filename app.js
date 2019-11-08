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

const io = require("socket.io")(server);
const User = require("./models/User");

io.on("connection", socket => {
  console.log("a new connection has been made to the global webSocket");
});

User.find({}).then(users => {
  users.forEach(user => {
    const userIo = io.of(`/${user._id}`);
    userIo.on("connection", socket => {
      io.emit("online user", user.username);
      console.log(user.username, "connected to the socket");
      io.emit("online user", user.username);
    });
  });
});

module.exports = server;
