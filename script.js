const captureButton = document.getElementById("capture");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendMessageButton = document.getElementById("send-message");
const photo = document.getElementById("photo");
const socket = io();

// Event listener for sending a message
sendMessageButton.addEventListener("click", async function () {
    const message = chatInput.value.trim();
    if (message) {
        const username = "User";  // Replace with actual username
        await sendMessage(username, message);
        chatInput.value = "";
    }
});

// Function to send a message to the backend
async function sendMessage(username, message) {
    const response = await fetch("/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message })
    });
    const newMessage = await response.json();
    addChatMessage(newMessage);
}

// Function to display chat messages in the UI
function addChatMessage(message) {
    const messageElement = document.createElement("p");
    messageElement.textContent = `${message.username}: ${message.message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Listen for new messages from the server
socket.on("new-message", (message) => {
    addChatMessage(message);
});

// Function to capture a photo and upload it to the server
captureButton.addEventListener("click", async function () {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const camera = document.getElementById("camera");
    
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    context.drawImage(camera, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    const formData = new FormData();
    formData.append("photo", dataURLtoBlob(dataUrl));

    const response = await fetch("/upload-photo", {
        method: "POST",
        body: formData
    });
    const uploadedImage = await response.json();
    photo.src = uploadedImage.url;
});

// Helper function to convert base64 image to Blob
function dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
}
