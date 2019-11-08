const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const validator = require("validator");

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      validate(password) {
        if (password.length < 6) {
          throw new Error("password must be at least 6 characters long");
        }
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate(email) {
        if (!validator.isEmail(email)) {
          throw new Error("The email is incorrect");
        }
      }
    },
    tokens: [
      {
        token: {
          type: String
        }
      }
    ]
  },
  { timestamps: true }
);

userSchema.virtual("sent", {
  ref: "message",
  localField: "_id",
  foreignField: "from"
});
userSchema.virtual("received", {
  ref: "message",
  localField: "_id",
  foreignField: "to"
});

userSchema.statics.logIn = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error();
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    const token = await user.genAuthToken();
    return { token, user };
  }
  throw new Error();
};

userSchema.methods.genAuthToken = async function() {
  const token = jwt.sign({ _id: this._id }, "auth");
  this.tokens = [...this.tokens, { token }];
  await this.save();
  return token;
};

userSchema.pre("save", async function(next) {
  if (this.modifiedPaths().includes("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

userSchema.methods.toJSON = function() {
  const { _doc: user } = this;
  return { ...user, password: undefined, tokens: undefined };
};

const User = model("user", userSchema);
module.exports = User;
