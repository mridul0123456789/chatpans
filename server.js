const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const socketIo = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to handle JSON data and static files
app.use(express.json());
app.use(express.static("uploads"));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/snapchat-clone", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.log("Error connecting to MongoDB", err);
});

// Define a schema for chat messages and images
const messageSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
});

const imageSchema = new mongoose.Schema({
    filename: String,
    url: String,
    timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);
const Image = mongoose.model("Image", imageSchema);

// Set up Multer for handling image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API to handle sending a chat message
app.post("/send-message", async (req, res) => {
    const { username, message } = req.body;
    const newMessage = new Message({ username, message });
    await newMessage.save();
    io.emit("new-message", newMessage); // Emit the new message to all clients
    res.json(newMessage);
});

// API to handle uploading an image
app.post("/upload-photo", upload.single("photo"), async (req, res) => {
    const { file } = req;
    const newImage = new Image({ filename: file.filename, url: `/uploads/${file.filename}` });
    await newImage.save();
    res.json(newImage);
});

// API to get chat messages
app.get("/messages", async (req, res) => {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    res.json(messages);
});

// API to get all images
app.get("/images", async (req, res) => {
    const images = await Image.find().sort({ timestamp: -1 }).limit(50);
    res.json(images);
});

// Serve static files for uploaded images
app.use('/uploads', express.static('uploads'));

// Start the server
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

// Socket.io for real-time communication
io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});
