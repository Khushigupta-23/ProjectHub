const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const User = require('../models/user');
const Review = require('../models/review');
const { isLoggedIn } = require('../middleware');
const Notification = require('../models/notification'); 


// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    req.flash('error', 'You do not have permission to access this page.');
    return res.redirect('/listings');
  }
  next();
};

// GET /admin (Admin Dashboard)
router.get('/admin', isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    const listings = await Listing.find().populate('author');
    const reportedListings = await Listing.find({ reports: { $gt: 0 } }).populate('author');
    const users = await User.find();
    const reviews = await Review.find().populate('author').populate('listing');
    res.render('admin/index', { listings, reportedListings, users, reviews });
  } catch (err) {
    req.flash('error', 'Something went wrong!');
    res.redirect('/listings');
  }
});

// DELETE /admin/listings/:id (Delete a listing)
// DELETE /admin/listings/:id (Delete a listing)
router.delete('/admin/listings/:id', isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate('author');
    if (!listing) {
      req.flash('error', 'Project idea not found!');
      return res.redirect('/admin');
    }

    // ✅ Create a new notification using the Notification model
    await Notification.create({
      recipient: listing.author._id,
      message: `Your project idea "${listing.title}" was deleted by an admin due to reports. Please avoid posting inappropriate content.`,
      listing: listing._id,
      read: false
    });

    // ✅ Delete the listing
    await Listing.findByIdAndDelete(id);

    req.flash('success', 'Project idea deleted and warning sent to user!');
    res.redirect('/admin');
  } catch (err) {
    req.flash('error', 'Failed to delete project idea!');
    res.redirect('/admin');
  }
});


// DELETE /admin/users/:id (Delete a user)
router.delete('/admin/users/:id', isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      req.flash('error', 'User not found!');
      return res.redirect('/admin');
    }
    if (user.isAdmin) {
      req.flash('error', 'Cannot delete an admin user!');
      return res.redirect('/admin');
    }
    await User.findByIdAndDelete(id);
    req.flash('success', 'User deleted successfully!');
    res.redirect('/admin');
  } catch (err) {
    req.flash('error', 'Failed to delete user!');
    res.redirect('/admin');
  }
});

// DELETE /admin/reviews/:id (Delete a review)
router.delete('/admin/reviews/:id', isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      req.flash('error', 'Comment not found!');
      return res.redirect('/admin');
    }
    await Listing.findByIdAndUpdate(review.listing, { $pull: { comments: id } });
    await Review.findByIdAndDelete(id);
    req.flash('success', 'Comment deleted successfully!');
    res.redirect('/admin');
  } catch (err) {
    req.flash('error', 'Failed to delete comment!');
    res.redirect('/admin');
  }
});

module.exports = router;
