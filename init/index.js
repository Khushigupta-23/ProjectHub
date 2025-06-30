// seeds/init.js
const mongoose = require('mongoose');
const Listing = require('../models/listing');
const initData = require('./data'); // your sampleListings

main()
  .then(() => console.log("MongoDB Connection Successful"))
  .catch((err) => console.log("Connection Error:", err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/projectHub");
}

const initDB = async () => {
  await Listing.deleteMany({});
  await Listing.insertMany(initData);
  console.log("📦 Database Seeded with Sample Listings!");
};

initDB().then(() => {
  mongoose.connection.close();
});
