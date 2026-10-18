/* =========================================================
   AI FINANCIAL ASSISTANT (Google Gemini Integrated)
   File: script.js
   Purpose: Website interaction, chat, forms, and Direct Gemini API
   ========================================================= */

// ⚠️ এখানে আপনার বন্ধুর জেমিনি এপিআই কি বসাতে হবে
const GEMINI_API_KEY = "AQ.Ab8RN6LMWHLpt_v1aqpEgyeZiKQQ2AbxCAf5L3WFRdUTTcuS9g";

document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------
    // 1. SELECT HTML ELEMENTS (Matched with index.html)
    // -----------------------------------------------------

    const chatForm = document.querySelector("#chatForm");
    const chatInput = document.querySelector("#chatInput");
    const chatMessages = document.querySelector("#chatMessages");
    const sendButton = document.querySelector("#sendButton");

    const modal = document.querySelector("#infoModal");
    const studentForm = document.querySelector("#studentForm");
    const openModalButtons = document.querySelectorAll("[data-open-modal], #get-started, #start-chatbot");
    const closeModalButtons = document.querySelectorAll("#closeModal");

    const menuButton = document.querySelector("#menuToggle");
    const navigation = document.querySelector("#navLinks");

    let studentInfo = {};
    let isWaitingForReply = false;

    // -----------------------------------------------------
    // 2. HELPER FUNCTIONS
    // -----------------------------------------------------

    function showNotification(message) {
        let notification = document.querySelector("#app-notification");

        if (!notification) {
            notification = document.createElement("div");
            notification.id = "app-notification";
            notification.setAttribute("role", "status");

            Object.assign(notification.style, {
                position: "fixed",
                bottom: "24px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: "9999",
                maxWidth: "90%",
                padding: "14px 22px",
                borderRadius: "14px",
                background: "#101c3b",
                color: "#ffffff",
                border: "1px solid #32e6ff",
                boxShadow: "0 0 25px rgba(50, 230, 255, 0.2)",
                fontSize: "14px"
            });
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.hidden = false;

        clearTimeout(notification._hideTimer);
        notification._hideTimer = setTimeout(() => {
            notification.hidden = true;
        }, 3500);
    }

    function scrollToSection(selector) {
        const section = document.querySelector(selector);
        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function addMessage(text, sender = "assistant") {
        if (!chatMessages) return null;

        const message = document.createElement("div");
        message.classList.add("message", sender === "user" ? "user-message" : "assistant-message");

        const avatar = document.createElement("div");
        avatar.classList.add("message-avatar");
        avatar.textContent = sender === "user" ? "U" : "S";

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("message-content");

        const senderSpan = document.createElement("span");
        senderSpan.classList.add("message-sender");
        senderSpan.textContent = sender === "user" ? "You" : "StudentFinance AI";

        const bubble = document.createElement("div");
        bubble.classList.add("message-bubble");
        
        // Convert basic markdown/newlines to HTML
        bubble.innerHTML = text.replace(/\n/g, "<br>");

        contentDiv.appendChild(senderSpan);
        contentDiv.appendChild(bubble);
        message.appendChild(avatar);
        message.appendChild(contentDiv);
        
        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return message;
    }

    function setLoading(isLoading) {
        isWaitingForReply = isLoading;
        if (sendButton) {
            sendButton.disabled = isLoading;
            sendButton.innerHTML = isLoading ? "..." : "↑";
        }
        if (chatInput) {
            chatInput.disabled = isLoading;
        }
    }

    function showTypingIndicator() {
        if (!chatMessages) return null;

        const indicator = document.createElement("div");
        indicator.className = "message assistant-message typing-container";
        
        const avatar = document.createElement("div");
        avatar.classList.add("message-avatar");
        avatar.textContent = "S";

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("message-content");

        const bubble = document.createElement("div");
        bubble.className = "typing-indicator";
        bubble.innerHTML = "<span></span><span></span><span></span>";

        contentDiv.appendChild(bubble);
        indicator.appendChild(avatar);
        indicator.appendChild(contentDiv);

        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return indicator;
    }

    // -----------------------------------------------------
    // 3. POP-UP / STUDENT INFORMATION FORM
    // -----------------------------------------------------

    function openStudentModal() {
        if (!modal) return;
        modal.hidden = false;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeStudentModal() {
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => { modal.hidden = true; }, 200);
    }

    openModalButtons.forEach(btn => btn.addEventListener("click", e => {
        e.preventDefault();
        openStudentModal();
    }));

    closeModalButtons.forEach(btn => btn.addEventListener("click", closeStudentModal));

    if (studentForm) {
        studentForm.addEventListener("submit", event => {
            event.preventDefault();
            const formData = new FormData(studentForm);
            studentInfo = Object.fromEntries(formData.entries());

            closeStudentModal();
            addMessage("Hello! I'm ready to help with your international student finances based on your profile. How can I assist you today?");
            scrollToSection("#assistant");
            showNotification("Your profile has been saved for this session.");
        });
    }

    // -----------------------------------------------------
    // 4. CHAT ASSISTANT (Direct Gemini API Call)
    // -----------------------------------------------------

    async function sendMessage(messageText) {
        const message = messageText.trim();
        if (!message || isWaitingForReply) return;

        addMessage(message, "user");
        if (chatInput) chatInput.value = "";

        setLoading(true);
        const typingIndicator = showTypingIndicator();

        try {
            if (GEMINI_API_KEY === "আপনার_বন্ধুর_জেমিনি_এপিআই_কি_এখানে_দিন") {
                throw new Error("API Key not set!");
            }

            // Build Context
            let studentContext = "Student Profile Information:\n";
            if (Object.keys(studentInfo).length > 0) {
                for (const [key, value] of Object.entries(studentInfo)) {
                    if (value) studentContext += `- ${key}: ${value}\n`;
                }
            } else {
                studentContext += "- No specific profile provided yet.\n";
            }

            const systemInstruction = "You are 'StudentFinanceAI', an expert and helpful financial assistant for international students. Use the provided student profile context to give tailored, accurate, and concise financial advice. Focus on tuition, international remittances, student loans, budgeting, and multi-currency options. Always be polite, professional, and clear.";
            
            const promptText = `${systemInstruction}\n\n${studentContext}\n\nUser Question: ${message}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: promptText }]
                    }]
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const replyText = data.candidates[0].content.parts[0].text;
                if (typingIndicator) typingIndicator.remove();
                addMessage(replyText, "assistant");
            } else {
                throw new Error("No response from AI.");
            }

        } catch (error) {
            console.error("Chat request failed:", error);
            if (typingIndicator) typingIndicator.remove();
            
            let errorMsg = "I am currently experiencing technical difficulties connecting to my AI core. Please try again later.";
            if (error.message.includes("API Key not set")) {
                errorMsg = "Please insert your Google Gemini API Key at the top of the script.js file to activate the AI.";
            }
            addMessage(errorMsg, "assistant");
        } finally {
            setLoading(false);
            if (chatInput) chatInput.focus();
        }
    }

    if (chatForm) {
        chatForm.addEventListener("submit", event => {
            event.preventDefault();
            if (chatInput) sendMessage(chatInput.value);
        });
    }

    // -----------------------------------------------------
    // 5. QUICK-QUESTION BUTTONS
    // -----------------------------------------------------

    document.querySelectorAll(".suggestion-chip").forEach(button => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.message;
            if (prompt) {
                scrollToSection("#assistant");
                sendMessage(prompt);
            }
        });
    });

    // -----------------------------------------------------
    // 6. MOBILE NAVIGATION
    // -----------------------------------------------------

    if (menuButton && navigation) {
        menuButton.addEventListener("click", () => {
            const isOpen = navigation.classList.toggle("is-open");
            menuButton.setAttribute("aria-expanded", String(isOpen));
        });

        navigation.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navigation.classList.remove("is-open");
                menuButton.setAttribute("aria-expanded", "false");
            });
        });
    }

    // -----------------------------------------------------
    // 7. INITIAL WELCOME MESSAGE
    // -----------------------------------------------------

    if (chatMessages && chatMessages.children.length === 1) {
        // Initial HTML message exists, no action needed
    }

    console.log("AI Financial Assistant (Gemini API) initialized successfully.");
});
