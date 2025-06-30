const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Notification = require('../models/notification');
const { isLoggedIn } = require('../middleware.js');

// Register route (GET)
router.get('/register', (req, res) => {
  res.render('users/register');
});

// Register route (POST)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash('success', 'Welcome to ProjectHub!');
      res.redirect('/listings');
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/register');
  }
});

// Login route (GET)
router.get('/login', (req, res) => {
  res.render('users/login');
});

// Login route (POST)
router.post('/login', passport.authenticate('local', {
  failureFlash: true,
  failureRedirect: '/login'
}), (req, res) => {
  req.flash('success', 'Welcome back!');
  res.redirect('/listings');
});

// Logout route
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully!');
    res.redirect('/');
  });
});

// Edit profile route (GET)
router.get('/users/:id/edit', isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Check if id is a valid ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      req.flash('error', 'Invalid user ID!');
      return res.redirect('/listings');
    }
    // Ensure req.user exists
    if (!req.user || !req.user._id) {
      req.flash('error', 'User session not found! Please log in again.');
      return res.redirect('/login');
    }
    // Check if user is editing their own profile
    if (!id === req.user._id.toString()) {
      req.flash('error', 'You can only edit your own profile!');
      return res.redirect(`/users/${req.user._id}`);
    }
    const user = await User.findById(id);
    if (!user) {
      req.flash('error', 'User not found!');
      return res.redirect('/listings');
    }
    res.render('users/edit', { user });
  } catch (err) {
    next(err);
  }
});

// Update profile route (PUT)
router.put('/users/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Check if id is a valid ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      req.flash('error', 'Invalid user ID!');
      return res.redirect('/listings');
    }
    // Ensure req.user exists
    if (!req.user || !req.user._id) {
      req.flash('error', 'User session not found! Please log in again.');
      return res.redirect('/login');
    }
    // Check if user is editing their own profile
    if (id !== req.user._id.toString()) {
      req.flash('error', 'You can only edit your own profile!');
      return res.redirect(`/users/${req.user._id}`);
    }
    const upload = res.locals.upload.single('profilePicture');
    upload(req, res, async (err) => {
      if (err) {
        req.flash('error', 'Error uploading profile picture!');
        return res.redirect(`/users/${id}/edit`);
      }
      const { username, email } = req.body;
      const updateData = {
        username: req.sanitize(username),
        email: req.sanitize(email)
      };
      if (req.file) {
        updateData.profilePicture = `/uploads/${req.file.filename}`;
      }
      await User.findByIdAndUpdate(id, updateData);
      req.flash('success', 'Profile updated successfully!');
      res.redirect(`/users/${id}`);
    });
  } catch (err) {
    next(err);
  }
});

// Mark notification as read (POST)
router.post('/notifications/:id/read', isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    req.flash('success', 'Notification marked as read!');
    res.redirect(`/users/${req.user._id}`);
  } catch (err) {
    next(err);
  }
});

// Delete notification (DELETE)
router.delete('/notifications/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    req.flash('success', 'Notification deleted successfully!');
    res.redirect(`/users/${req.user._id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;