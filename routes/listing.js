const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const User = require('../models/user');
const Report = require('../models/report');
const { isLoggedIn, isOwner, canVote } = require('../middleware');

// Index route - Show all listings with search, sort, category filter, and pagination
router.get('/listings', isLoggedIn, async (req, res) => {
  const { q, sort, category, page = 1 } = req.query;
  const limit = 10;
  let query = {};

  // Search by title, description, category, or tags
  if (q) {
    query = {
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    };
  }

  // Filter by category
  if (category && category !== 'all') {
    query.category = category;
  }

  // Sort options
  let sortOption = {};
  if (sort === 'upvotes') {
    sortOption = { upvotes: -1 };
  } else if (sort === 'date') {
    sortOption = { createdAt: -1 };
  }

  const totalListings = await Listing.countDocuments(query);
  const listings = await Listing.find(query)
    .populate('author')
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  const totalPages = Math.ceil(totalListings / limit);

  // List of categories for filter dropdown
  const categories = [
    'Web Development',
    'Mobile App Development',
    'Artificial Intelligence/Machine Learning',
    'Internet of Things (IoT)',
    'Robotics',
    'Cybersecurity',
    'Data Science',
    'Cloud Computing',
    'Embedded Systems',
    'Game Development',
    'Blockchain',
    'Augmented Reality/Virtual Reality (AR/VR)',
    'Software Engineering',
    'Hardware Design',
    'Signal Processing'
  ];

  res.render('listings/index', { 
    listings, 
    q, 
    sort, 
    category: category || 'all',
    currentPage: parseInt(page), 
    totalPages,
    limit,
    categories
  });
});

// Search suggestions (GET)
router.get('/listings/suggestions', isLoggedIn, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    const suggestions = await Listing.find({
      title: { $regex: q, $options: 'i' }
    }).select('title').limit(5);
    res.json(suggestions.map(s => s.title));
  } catch (err) {
    res.status(500).json([]);
  }
});

// New listing form (GET)
router.get('/listings/new', isLoggedIn, (req, res) => {
  res.render('listings/new');
});

// Create listing (POST)
router.post('/listings', isLoggedIn, async (req, res) => {
  const { title, description, category, tags } = req.body;
  const listing = new Listing({
    title: req.sanitize(title),
    description: req.sanitize(description),
    category,
    tags: tags ? req.sanitize(tags).split(',').map(tag => tag.trim()) : [],
    author: req.user._id
  });
  await listing.save();
  req.flash('success', 'Project idea added successfully!');
  res.redirect('/listings');
});

// Show single listing (GET)
router.get('/listings/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate('author').populate({
      path: 'comments',
      populate: { path: 'author' }
    });
    if (!listing) {
      req.flash('error', 'Project idea not found!');
      return res.redirect('/listings');
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error', 'User not found!');
      return res.redirect('/listings');
    }
    const isSaved = user.savedIdeas ? user.savedIdeas.includes(id) : false;
    res.render('listings/show', { listing, isSaved });
  } catch (err) {
    next(err);
  }
});

// Edit listing form (GET)
router.get('/listings/:id/edit', isLoggedIn, isOwner, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash('error', 'Project idea not found!');
    return res.redirect('/listings');
  }
  res.render('listings/edit', { listing });
});

// Update listing (PUT)
router.put('/listings/:id', isLoggedIn, isOwner, async (req, res) => {
  const { id } = req.params;
  const { title, description, category, tags } = req.body;
  const listing = await Listing.findByIdAndUpdate(id, {
    title: req.sanitize(title),
    description: req.sanitize(description),
    category,
    tags: tags ? req.sanitize(tags).split(',').map(tag => tag.trim()) : []
  }, { new: true });
  req.flash('success', 'Project idea updated successfully!');
  res.redirect(`/listings/${id}`);
});

// Delete listing (DELETE)
router.delete('/listings/:id', isLoggedIn, isOwner, async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash('success', 'Project idea deleted successfully!');
  res.redirect('/listings');
});

// Upvote listing (POST)
router.post('/listings/:id/upvote', isLoggedIn, canVote, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  listing.upvotes += 1;
  listing.upvoters.push(req.user._id);
  await listing.save();
  req.flash('success', 'Upvoted successfully!');
  res.redirect(`/listings/${id}`);
});

// Downvote listing (POST)
router.post('/listings/:id/downvote', isLoggedIn, canVote, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  listing.downvotes += 1;
  listing.downvoters.push(req.user._id);
  await listing.save();
  req.flash('success', 'Downvoted successfully!');
  res.redirect(`/listings/${id}`);
});

// Save listing (POST)
router.post('/listings/:id/save', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    req.flash('error', 'User not found!');
    return res.redirect(`/listings/${id}`);
  }
  if (!user.savedIdeas.includes(id)) {
    user.savedIdeas.push(id);
    await user.save();
    req.flash('success', 'Idea saved successfully!');
  } else {
    req.flash('error', 'Idea already saved!');
  }
  res.redirect(`/listings/${id}`);
});

// Unsave listing (DELETE)
router.delete('/listings/:id/save', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    req.flash('error', 'User not found!');
    return res.redirect(`/listings/${id}`);
  }
  user.savedIdeas = user.savedIdeas.filter(savedId => savedId.toString() !== id);
  await user.save();
  req.flash('success', 'Idea unsaved successfully!');
  res.redirect(`/listings/${id}`);
});

// Report listing (POST)
router.post('/listings/:id/report', isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', 'Project idea not found!');
      return res.redirect('/listings');
    }
    // Check if user already reported this listing
    const existingReport = await Report.findOne({ listing: id, reportedBy: req.user._id });
    if (existingReport) {
      req.flash('error', 'You have already reported this idea!');
      return res.redirect(`/listings/${id}`);
    }
    const report = new Report({
      listing: id,
      reportedBy: req.user._id,
      reason: req.sanitize(reason)
    });
    await report.save();
    req.flash('success', 'Idea reported successfully!');
    res.redirect(`/listings/${id}`);
  } catch (err) {
    req.flash('error', 'Error reporting idea!');
    res.redirect(`/listings/${id}`);
  }
});

module.exports = router;