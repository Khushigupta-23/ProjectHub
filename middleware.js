/* Full Path: C:\my collage\Programming\projects\ProjectHub\middleware.js */
const Listing = require('./models/listing');
const Review = require('./models/review');

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be logged in to perform this action.');
    return res.redirect('/login');
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {    req.flash('error', 'Project idea not found!');
    return res.redirect('/listings');
  }
  if (!listing.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review) {
    req.flash('error', 'Comment not found!');
    return res.redirect(`/listings/${id}`);
  }
  if (!review.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.canVote = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash('error', 'Project idea not found!');
    return res.redirect('/listings');
  }
  if (listing.upvoters.includes(req.user._id) || listing.downvoters.includes(req.user._id)) {
    req.flash('error', 'You have already voted on this project idea!');
    return res.redirect(`/listings/${id}`);
  }
  next();
};