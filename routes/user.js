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

// Mark notification as read (POST)
router.post('/notifications/:id/read', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  await Notification.findByIdAndUpdate(id, { read: true });
  req.flash('success', 'Notification marked as read!');
  res.redirect(`/users/${req.user._id}`);
});

// Delete notification (DELETE)
router.delete('/notifications/:id', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  await Notification.findByIdAndDelete(id);
  req.flash('success', 'Notification deleted successfully!');
  res.redirect(`/users/${req.user._id}`);
});

module.exports = router;