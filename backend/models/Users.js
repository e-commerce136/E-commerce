// models/Users.js
const mongoose = require('mongoose');

const UsersSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

let Users;

try {
  Users = mongoose.model('Users');
} catch (error) {
  if (error.name === 'MissingSchemaError') {
    Users = mongoose.model('Users', UsersSchema);
  } else {
    throw error;
  }
}

module.exports = Users;