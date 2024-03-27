const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const app = express();
const cors = require("cors");

app.use(cors({
  origin:"*",
  methods:['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const connectDB = require('./connectMongo');
const User = require('./models/user');
const Todo = require('./models/todo');

const generateSecretKey = () => {
    const secretKey = crypto.randomBytes(32).toString("hex");
  
    return secretKey;
  };

const secretKey = generateSecretKey();

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        console.log(users);
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get('/api/todos/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const todos = await Todo.find({ userId: userId });
        return res.status(200).json({ todos });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered");
    }

    const newUser = new User({
      name,
      email,
      password,
    });

    await newUser.save();

    res.status(202).json({ message: "User registered successfully" });
  } catch (error) {
    console.log("Error registering the user", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid Email" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    jwt.sign({ userId: user._id }, secretKey, (error, token) => {
      if (error) {
        console.error("Error generating token:", error);
        return res.status(500).json({ message: "Token generation failed" });
      }
      console.log("Token generated successfully:", token);
      res.status(200).json({ token, userId: user._id });
    });
  } catch (error) {
    console.log("Login failed", error);
    res.status(500).json({ message: "Login failed" });
  }
});

connectDB(); 

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});
