const { Schema, model } = require('mongoose');

const otpSchema = new Schema(
  {
    emailId: {
      type: String,
      required: true,
    },

    otp: {
      type: Number,
      required: true,
    },

    types: {
      type: String,
      required: true,
      enum: ['signUp', 'passwordReset'],
    },

    expires: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: 'otpVerification',
    timestamps: true,
  }
);

otpSchema.index({ expires: 1 }, { expireAfterSeconds: 300 });

module.exports = model('OtpModel', otpSchema);
