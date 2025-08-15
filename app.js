const DbConnection = require('./src/config/database.js');
const User = require('./src/model/userModel.js');
const Connection = require('./src/model/connectionModel.js');
const OtpModel = require('./src/model/otpModel.js');
const {
  globalRateLimit,
  signUpRateLimit,
  loginRateLimit,
} = require('./src/middlewares/rateLimit.js');
const sendEmail = require('./src/config/mailService.js');
const { userAuth } = require('./src/middlewares/userAuth.js');
const updateProfileValidation = require('./utils/updateProfileValidation.js');
const signUpValidation = require('./utils/signUpValidation.js');
const validator = require('validator');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const JWT = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const { mongoose } = require('mongoose');

const app = express();
const PORT = 5656;
app.use(
  cors({
    origin: '*', // Allow any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.set('trust proxy', 1);
app.use(globalRateLimit);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.post('/verifyEmail', async (req, res) => {
  try {
    const emailId = req.cookies.email;
    const userOtp = req.body.otp;

    if (emailId && userOtp) {
      res.status(400).json({ message: 'Credentials Missing' });
    }

    const findUser = await OtpModel.findOne({ emailId: emailId });

    if (findUser) {
      const otp = findUser.otp;
      if (userOtp === otp) {
        await User.updateOne(
          { emailId: emailId },
          { $set: { isVerified: true } }
        );
        res.status(200).json({ message: 'User Verified' });
      } else {
        res.status(400).json({ message: 'send OTP Again' });
      }
    } else {
      res.status(400).json({ message: 'OTP is not valid' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/signup', signUpRateLimit, signUpValidation, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      emailId,
      password,
      age,
      gender,
      photoUrl,
    } = req.body;

    const emailValidation = await User.findOne({ emailId: emailId });

    if (emailValidation) {
      return res.status(409).json({ Error: 'This email is already in use' });
    }

    const userNameValidation = await User.findOne({ userName: userName });
    if (userNameValidation) {
      return res.status(409).json({ Error: 'User Name Not Available' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userSignUp = new User({
      firstName,
      lastName,
      userName,
      emailId,
      password: passwordHash,
      age,
      gender,
      photoUrl,
    });
    await userSignUp.save();
    const newUser = await User.findOne({ emailId: emailId });
    const token = JWT.sign({ id: newUser._id }, process.env.JWT_SECRET);
    res.cookie('token', token, {
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    const generateOtp = Math.ceil(Math.random() * 60000 + 1050);
    sendEmail(
      emailId,
      `OTP verification`,
      `'Hello ${firstName}, Your Login In OTP is : ${generateOtp}, OTP Validity is only 5 minutes `
    );
    const otp = new OtpModel({
      emailId: emailId,
      otp: generateOtp,
      types: 'signUp',
    });
    await otp.save();
    res.cookie('email', emailId, {
      httpOnly: true,
      maxAge: 5 * 60 * 1000,
      secure: true,
    });
    res.send('done');
  } catch (error) {
    console.log(error);
    res.status(500).json({ Error: 'Internal Server Error,Please try again' });
  }
});

app.post('/login', loginRateLimit, async (req, res) => {
  try {
    if (!req.body) {
      return res.status(404).json({ message: 'Invalid Credentials' });
    }

    const { emailId, password } = req.body;
    if (!emailId || !password) {
      return res.status(404).json({ message: 'Invalid Credentials' });
    }

    if (!validator.isEmail(emailId)) {
      return res.status(404).json({ Error: 'Enter a Valid Email' });
    }

    const user = await User.findOne(
      { emailId: emailId },
      { password: 1, _id: 1 }
    );

    if (!user) {
      return res.status(404).json({ message: 'Invalid Credentials' });
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (comparePassword) {
      const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET);
      res.cookie('token', token, {
        secure: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({ message: 'Login Successful' });
    }

    return res.status(404).json({ message: 'Invalid Credentials' });
  } catch (error) {
    console.log(error);
  }
});

app.get('/Profile', userAuth, async (req, res) => {
  try {
    const user = await User.findOne(
      { _id: req.id },
      { _id: 0, __v: 0, password: 0, createdAt: 0, updatedAt: 0 }
    );

    return res.send(user);
  } catch (error) {
    return res.status(500).json({ Error: 'Something Went Wrong' });
  }
});

app.patch(
  '/updateProfile',
  userAuth,
  updateProfileValidation,
  async (req, res, next) => {
    try {
      if (req?.body?.password) {
        const passwordHash = await bcrypt.hash(req.body.password, 10);
        req.body.password = passwordHash;
      }
      console.log(req.body);

      await User.updateOne(
        { _id: req.id },
        { $set: req.body },
        { runValidators: true }
      );
      res.status(200).send({ message: 'Updated Successfully' });
    } catch (error) {
      console.log(error);

      res.status(500).send({ message: 'Something Went Wrong' });
    }
  }
);

app.get('/logout', userAuth, async (req, res, next) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  res.status(400).json({ message: 'Log out Successful' });
});

app.get('/feed', userAuth, async (req, res) => {
  try {
    const existingConnection = await Connection.find(
      {
        $or: [{ senderId: req.id }, { receiverId: req.id }],
      },
      { senderId: 1, receiverId: 1, _id: 0 }
    );

    const existingConnectionId = existingConnection.flatMap((element) => [
      element.receiverId.toString(),
      element.senderId.toString(),
    ]);

    const existingUniqueId = new Set(existingConnectionId);

    const feedUniqueId = await User.find({
      $and: [
        { _id: { $nin: Array.from(existingUniqueId) } },
        { _id: { $ne: req.id } },
      ],
    }).select('firstName lastName age gender photoUrl -_id');

    res.status(200).send(feedUniqueId);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error !' });
  }
});
app.post('/sendConnection/:receiverId/:status', userAuth, async (req, res) => {
  try {
    const senderId = req.id;
    const { receiverId, status } = req.params;
    const validStatus = ['interested', 'ignore'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: 'Request type not allowed' });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: 'Valid Id Required' });
    }
    const checkReceiverId = await User.findOne({
      _id: receiverId,
    });

    if (!checkReceiverId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (existingConnection) {
      return res
        .status(400)
        .json({ message: 'Connection Request Already Exists' });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "You can't sent Request yourself" });
    }

    const connection = new Connection({
      senderId: senderId,
      receiverId: receiverId,
      status: status,
    });
    connection.save();
    res.status(200).json({ message: 'Request Send' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
    console.log(error);
  }
});
app.get('/showRequest', userAuth, async (req, res) => {
  try {
    const showRequest = await Connection.find(
      {
        $and: [{ receiverId: req.id }, { status: 'interested' }],
      },
      { _id: 0, __v: 0, receiverId: 0, createdAt: 0, updatedAt: 0 }
    ).populate('receiverId');
    if (showRequest.length === 0) {
      return res.status(200).json({ message: 'No Request Found' });
    }

    return res.status(200).send(showRequest);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Internal Server Error' });
  }
});

app.patch('/reviewConnection/:senderId/:review', userAuth, async (req, res) => {
  try {
    const { senderId, review } = req.params;
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: 'Enter a valid ID' });
    }
    const validReview = ['accepted', 'rejected'];
    if (!validReview.includes(review)) {
      return res.status(400).json({ message: 'Review Type Allowed' });
    }
    const update = await Connection.findOneAndUpdate(
      {
        senderId: senderId,
        receiverId: req.id,
        status: 'interested',
      },
      {
        $set: {
          status: review,
        },
      },
      {
        runValidators: true,
      }
    );

    if (!update) {
      return res.status(404).json({ message: 'Request Not Found' });
    }
    res.status(200).json({ message: 'Review Done' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/connection', userAuth, async (req, res) => {
  try {
    const connection = await Connection.find({
      $or: [{ senderId: req.id }, { receiverId: req.id }],
      status: 'accepted',
    })
      .populate('senderId', 'firstName lastName gender age photoUrl')
      .populate('receiverId', 'firstName lastName gender age photoUrl')
      .select('senderId  -_id');

    const getConnection = connection.map((element) => {
      if (element?.senderId?._id?.toString() === req.id) {
        return element?.receiverId;
      }

      if (element?.receiverId?._id?.toString() === req.id) {
        return element.senderId;
      }
    });

    if (getConnection.length === 0) {
      return res.status(200).json({ message: 'No Connection Found' });
    }
    const actualConnection = getConnection.filter(Boolean);
    res.status(200).send(actualConnection);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error !' });
  }
});

app.use((req, res) => {
  res.status(404).json({ status: 'Page Not Found' });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('Bad JSON');
    return res.status(400).json({ message: 'Invalid JSON Format ' });
  }
  res.status(500).send('Internal Server Error');
  console.log(error);
});

DbConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`App Running On ${PORT} 💁`);
  });
  console.log('db Connected 🔥');
});
