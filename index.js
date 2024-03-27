const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();
const port = 3000;
const cors = require("cors");
app.use(cors({
  origin:"*",
  methods:['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

const connectDB = require('./connectMongo');
const User = require('./models/user');
const Todo = require('./models/todo');

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

connectDB(); 

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});
