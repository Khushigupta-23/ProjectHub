const express = require('express');
const passportLocalMongoose = require('passport-local-mongoose');

const router = express.Router();


const mongoose = require('mongoose'); // ✅ Add this line
const { Schema } = mongoose;


const UserSchema = new Schema({
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
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    default: []
  }],
  profilePicture: {
    type: String,
    default: '/images/default-profile.png' // Default image path
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  notifications: [{
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing' }
  }]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
