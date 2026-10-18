
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const sendButton = document.getElementById("send-button");

const API_URL = "https://falconai-0n58.onrender.com/api/chat";

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent =
    sender === "user" ? "You" : "StudentFinanceAI";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  message.append(label, bubble);
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return bubble;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = chatInput.value.trim();

  if (!message || sendButton.disabled) return;

  addMessage(message, "user");
  chatInput.value = "";
  chatInput.style.height = "auto";
  sendButton.disabled = true;
  sendButton.textContent = "Thinking...";

  const replyBubble = addMessage("Thinking...", "assistant");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "The AI service is unavailable."
      );
    }

    replyBubble.textContent =
      data.reply || "Sorry, no response was received.";

  } catch (error) {
    replyBubble.textContent =
      "দুঃখিত, AI-এর সঙ্গে যোগাযোগ করা যাচ্ছে না। একটু পরে আবার চেষ্টা করো।";

    console.error("Chat request failed:", error);

  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "Send ↑";
    chatInput.focus();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height =
    Math.min(chatInput.scrollHeight, 160) + "px";
});
