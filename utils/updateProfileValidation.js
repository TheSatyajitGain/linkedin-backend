const validator = require('validator');
const updateProfileValidation = (req, res, next) => {
  if (req.body === undefined) {
    return res.status(400).json({ message: 'Update Failed' });
  }
  const { firstName, lastName, password, age, gender, photoUrl } = req.body;
  const restrictedFields = ['_id', 'userName', 'emailId'];
  const checkFields = Object.keys(req.body).some((ele) => {
    return restrictedFields.includes(ele);
  });
  if (checkFields) {
    return res.status(400).json({ message: 'Change not allowed' });
  }

  if (firstName) {
    if (firstName?.length < 4 || firstName.length > 20) {
      return res
        .status(400)
        .json({ error: 'First Name Should be under 4 -20 Characters' });
    }
  }

  if (lastName?.length > 20) {
    return res
      .status(400)
      .json({ error: 'Last Name Should be under 20 Characters' });
  }

  if (password) {
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
  if (gender) {
    const allowedGender = ['male', 'female', 'other'];
    if (!allowedGender.includes(gender)) {
      return res.status(400).json({ message: 'Gender Type Not Allowed' });
    }
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

  req.body = {
    firstName: modifiedFirstName,
    lastName: modifiedLastName,
    password,
    age,
    gender,
    photoUrl,
  };

  next();
};

module.exports = updateProfileValidation;
