const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: "User", // Refers to the User model
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum:["pending", "completed"],
        default: "pending",
    },
    category: {
        type: String,
        required: true,
    },
    dueDate: {
        type: Date, // Store as Date object
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const Todo = mongoose.model("Todo", todoSchema);

module.exports = Todo;
