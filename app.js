const express = require("express");
const mongoose = require("mongoose");
const layout = require("express-ejs-layouts");
const path = require("path");
const todoRoutes = require("./routes/todoRoutes");
require("dotenv").config();

const app = express();

// تنظیم پورت و Mongo URI از env یا مقدار پیش‌فرض
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || mongodb+srv://zargolkanaani:Zargol123456789@cluster0.yvkkdht.mongodb.net/?appName=Cluster0;

// اتصال به MongoDB Atlas
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// تنظیمات EJS
app.set("view engine", "ejs");
app.use(layout);
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", todoRoutes);

// خطای 404 ساده
app.use((req, res) => {
  res.status(404).render("404", { title: "صفحه پیدا نشد" });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
