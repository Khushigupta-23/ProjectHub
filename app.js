const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressSanitizer = require('express-sanitizer');
const multer = require('multer');
const User = require('./models/user');
const Listing = require('./models/listing');
const Review = require('./models/review');
const Notification = require('./models/notification');
const { isLoggedIn } = require('./middleware.js');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const app = express();

// Set EJS as view engine and EJS-Mate as engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sanitize inputs
app.use(expressSanitizer());

// Method override for PUT/DELETE requests
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: 'thisisasecret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Flash messages
app.use(flash());

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Make flash messages, current user, and upload available to all templates
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.user;
  res.locals.upload = upload;
  next();
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/projectHub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
const userRoutes = require('./routes/user');
const listingRoutes = require('./routes/listing');
const reviewRoutes = require('./routes/review');

app.use('/', userRoutes);
app.use('/', listingRoutes);
app.use('/', reviewRoutes);

// Home route with featured ideas
app.get('/', async (req, res) => {
  const featuredListings = await Listing.find().sort({ upvotes: -1 }).limit(3).populate('author');
  res.render('home', { featuredListings });
});

// User profile route
app.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('savedIdeas');
    if (!user) {
      req.flash('error', 'User not found!');
      return res.redirect('/listings');
    }
    const listings = await Listing.find({ author: id }).populate('author');
    const reviews = await Review.find({ author: id }).populate('listing');
    const notifications = await Notification.find({ recipient: id }).populate('listing');
    res.render('users/profile', { user, listings, reviews, notifications, savedIdeas: user.savedIdeas });
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  req.flash('error', 'Something went wrong!');
  res.redirect('/listings');
});

// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});