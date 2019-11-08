const { Schema, model } = require("mongoose");

const messageSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user"
    },
    to: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user"
    },
    text: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const Message = model("message", messageSchema);

module.exports = Message;
