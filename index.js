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

app.post("/todos/:userId", async(req, res) => {
  try{
    const userId = req.params.userId
    const {title, category, dueDate} = req.body;

    const newTodo = new Todo ({
      userId,
      title,
      category,
      dueDate: new Date(dueDate) // Store as Date object
    });

    await newTodo.save();

    const user = await User.findById(userId);
    if (!user){
      res.status(404).json({error: "User not found"})
    }

    user?.todos.push(newTodo._id);
    await user.save();

    res.status(200).json({message: "Todo added successfully", todo: newTodo});
  }catch(error) {
    res.status(500).json({message: "Todo not added"})
  }
})

app.get("/users/:userId/todos", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate("todos");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ todos: user.todos });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.log("Error fetching user information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/todos/:todoId/complete", async (req, res) => {
  try {
    const todoId = req.params.todoId;

    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      {
        status: "completed",
      },
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.status(200).json({ message: "Todo marked as complete", todo: updatedTodo });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/todos/completed/:date/:userId", async (req, res) => {
  try {
    const date = req.params.date;
    const user = req.params.userId;

    const startOfDay = moment(date).startOf('day'); // Start of the selected date
    const endOfDay = moment(date).endOf('day'); // End of the selected date

    const completedTodos = await Todo.find({
      userId: user,
      status: "completed",
      dueDate: { $gte: startOfDay, $lte: endOfDay } // Filter by dueDate
    }).exec();

    res.status(200).json({ completedTodos });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});


app.get("/todos/:userId/count", async (req, res) => {
  const userId = req.params.userId;

  try{
    const totalCompletedTodos = await Todo.countDocuments({
      userId: userId,
      status: "completed",
    }).exec();

    const totalPendingTodos = await Todo.countDocuments({
      userId: userId,
      status: "pending",
    }).exec();

    res.status(200).json({totalCompletedTodos, totalPendingTodos})
  }catch(error) {
    res.status(500).json({ error: "Network error"});
  }
});

app.delete("/todos/:todoId", async (req, res) => {
  try {
    const todoId = req.params.todoId;
    
    const deletedTodo = await Todo.findByIdAndDelete(todoId);
    
    if (!deletedTodo) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {

    console.log("Error deleting task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

connectDB(); 

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});
