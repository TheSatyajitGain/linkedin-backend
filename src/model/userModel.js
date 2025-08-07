const { Schema, model } = require('mongoose');

const userModel = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 20,
      trim: true,
    },
    lastName: {
      type: String,
      maxLength: 20,
      trim: true,
    },

    userName: {
      type: String,
      unique: true,
      minLength: 4,
      maxLength: 25,
      trim: true,
    },

    emailId: {
      type: String,
      required: true,
      maxLength: 40,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      maxLength: 300,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 99,
      trim: true,
    },
  },

  {
    collection: 'user',
  }
);

module.exports = model('User', userModel);
