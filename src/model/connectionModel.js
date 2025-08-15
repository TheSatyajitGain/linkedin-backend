const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const connectionModel = new Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: ['interested', 'ignore', 'accepted', 'rejected'],
      },
    },
  },
  {
    collection: 'connection',
    timestamps: true,
  }
);

module.exports = model('Connection', connectionModel);
