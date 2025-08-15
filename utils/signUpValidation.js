const validator = require('validator');
const signUpValidation = (req, res, next) => {
  if (req.body === undefined) {
    return res.status(400).json({ message: 'Sign Up Failed' });
  }

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

  if (req.body._id) {
    return res.status(409).json({ Error: 'Invalid Credentials' });
  }

  if (!firstName) {
    return res.status(400).json({ error: 'First Name is Required' });
  }

  if (firstName.length < 4 || firstName.length > 20) {
    return res
      .status(400)
      .json({ error: 'First Name Should be under 4 -20 Characters' });
  }

  if (lastName?.length > 20) {
    return res
      .status(400)
      .json({ error: 'Last Name Should be under 20 Characters' });
  }

  if (userName?.length > 25 || userName?.length < 4) {
    return res
      .status(400)
      .json({ error: 'User Name Should be between 4-25 Characters' });
  }

  const validateUserName = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;]/;

  if (validateUserName.test(userName)) {
    return res
      .status(409)
      .json({ Error: 'Special Characters Not Allowed In UserName' });
  }

  if (!emailId) {
    return res.status(400).json({ error: 'Email ID Required' });
  }
  if (emailId?.length > 40) {
    return res
      .status(400)
      .json({ error: 'Email ID Should be under 40 Characters' });
  }

  if (!validator.isEmail(emailId)) {
    return res.status(400).json({ error: 'Enter a Valid Email ID' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password Required' });
  }

  if (password?.length > 300 || password.length < 8) {
    return res
      .status(400)
      .json({ error: 'Password Should be Under 8 - 50 Characters' });
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(400).json({
      error: 'Minimum 1 Uppercase, 1 Number,1 Special Character',
    });
  }

  if (!age) {
    return res.status(400).json({ error: 'Age Required' });
  }
  if (typeof age !== 'number') {
    return res.status(400).json({ error: 'Age Should be Number' });
  }
  if (age > 99 || age < 18) {
    return res.status(400).json({ error: 'Age Should be under 18-99' });
  }
  const allowedGender = ['male', 'female', 'other'];
  if (!gender) {
    return res.status(400).json({ error: 'Gender Required' });
  }
  if (!allowedGender.includes(gender)) {
    return res.status(400).json({ message: 'Gender Type Not Allowed' });
  }
  if (photoUrl) {
    if (!validator.isURL(photoUrl)) {
      return res.status(400).json({ error: 'Enter a Valid URL' });
    }
  }

  const trim = (input) => {
    return input
      .trim()
      .split('')
      .filter((char) => {
        return char != ' ';
      })
      .join('');
  };

  const modifiedFirstName = trim(firstName);
  const modifiedLastName = trim(lastName);
  const modifiedUserName = trim(userName);

  req.body = {
    firstName: modifiedFirstName,
    lastName: modifiedLastName,
    userName: modifiedUserName,
    emailId,
    password,
    age,
    gender,
    photoUrl,
  };

  next();
};

module.exports = signUpValidation;
