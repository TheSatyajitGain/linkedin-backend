const DbConnection = require('./src/config/database.js');
const User = require('./src/model/userModel.js');
const { userAuth } = require('./src/middlewares/userAuth.js');
const signUpValidation = require('./utils/signUpValidation.js');
const validator = require('validator');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const JWT = require('jsonwebtoken');
const express = require('express');

const app = express();

const PORT = 5656;
app.use(express.json());
app.use(helmet());
app.use(cookieParser());

app.post('/signup', signUpValidation, async (req, res) => {
  try {
    const { firstName, lastName, userName, emailId, password, age } = req.body;

    if (req.body._id) {
      return res.status(409).json({ Error: 'Invalid Credentials' });
    }

    const emailValidation = await User.findOne({ emailId: emailId });
    if (emailValidation) {
      return res.status(409).json({ Error: 'This email is already in use' });
    }

    const validateUserName = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;]/;

    if (validateUserName.test(userName)) {
      return res
        .status(409)
        .json({ Error: 'Special Characters Not Allowed In UserName' });
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
    });
    await userSignUp.save();
    const newUser = await User.findOne({ emailId: emailId });
    const token = JWT.sign({ id: newUser._id }, process.env.JWT_SECRET);
    res.cookie('token', token);
    res.status(201).json({ message: 'Successfully Sign Up' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ Error: 'Internal Server Error,Please try again' });
  }
});

app.post('/login', async (req, res) => {
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
      res.cookie('token', token);
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
      { _id: 0, __v: 0, password: 0 }
    );

    return res.send(user);
  } catch (error) {
    return res.status(500).json({ Error: 'Something Went Wrong' });
  }
});

app.patch('/updateProfile', userAuth, async (req, res, next) => {
  res.send('done');
});

app.get('/feed', userAuth, (req, res) => {
  try {
    res.status(200).json({ message: 'success' });
  } catch (error) {
    console.log(error);
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
