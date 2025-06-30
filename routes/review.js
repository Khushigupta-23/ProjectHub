const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const Review = require('../models/review');
const Notification = require('../models/notification');
const { isLoggedIn } = require('../middleware');

// Create review (POST)
router.post('/listings/:id/reviews', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash('error', 'Project idea not found!');
    return res.redirect('/listings');
  }
  const review = new Review({
    body,
    author: req.user._id,
    listing: id
  });
  listing.comments.push(review);
  await review.save();
  await listing.save();

  // Create notification for the listing's author
  if (!listing.author.equals(req.user._id)) {
    const notification = new Notification({
      recipient: listing.author,
      message: `${req.user.username} commented on your idea: ${listing.title}`,
      listing: id
    });
    await notification.save();
  }

  req.flash('success', 'Comment added successfully!');
  res.redirect(`/listings/${id}`);
});

// Delete review (DELETE)
router.delete('/listings/:id/reviews/:reviewId', isLoggedIn, async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { comments: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash('success', 'Comment deleted successfully!');
  res.redirect(`/listings/${id}`);
});

module.exports = router;