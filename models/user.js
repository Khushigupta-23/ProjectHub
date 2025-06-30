const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  savedIdeas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    default: []
  }],
  profilePicture: {
    type: String,
    default: '/images/default-profile.png' // Default image path
  }
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);