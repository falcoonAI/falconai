
/* =========================================================
   AI FINANCIAL ASSISTANT
   File: script.js
   Purpose: Website interaction, chat, forms, voice input,
            navigation, pop-ups, and Python backend connection
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------
    // 1. SELECT HTML ELEMENTS
    // -----------------------------------------------------

    const chatForm = document.querySelector("#chat-form");
    const chatInput = document.querySelector("#chat-input");
    const chatMessages = document.querySelector("#chat-messages");
    const sendButton = document.querySelector("#send-button");

    const modal = document.querySelector("#student-modal");
    const studentForm = document.querySelector("#student-form");
    const openModalButtons = document.querySelectorAll(
        "[data-open-modal], #get-started, #start-chatbot"
    );
    const closeModalButtons = document.querySelectorAll(
        "[data-close-modal], #close-modal"
    );

    const voiceButton = document.querySelector(
        "#voice-button, #voice-search"
    );

    const menuButton = document.querySelector("#menu-toggle");
    const navigation = document.querySelector("#navigation");

    // Student information is kept in memory for this session.
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
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    // Display text safely. User input is never interpreted as HTML.
    function addMessage(text, sender = "assistant") {
        if (!chatMessages) {
            console.error("Chat message container not found.");
            return null;
        }

        const message = document.createElement("div");
        message.classList.add("chat-message", sender);

        const bubble = document.createElement("div");
        bubble.classList.add("message-bubble");
        bubble.textContent = text;

        message.appendChild(bubble);
        chatMessages.appendChild(message);

        chatMessages.scrollTop = chatMessages.scrollHeight;

        return message;
    }

    function setLoading(isLoading) {
        isWaitingForReply = isLoading;

        if (sendButton) {
            sendButton.disabled = isLoading;
            sendButton.textContent = isLoading ? "Thinking..." : "Send";
        }

        if (chatInput) {
            chatInput.disabled = isLoading;
        }
    }

    function showTypingIndicator() {
        if (!chatMessages) return null;

        const indicator = document.createElement("div");
        indicator.className = "chat-message assistant typing-indicator";
        indicator.setAttribute("aria-label", "Assistant is responding");
        indicator.textContent = "AI is thinking...";

        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return indicator;
    }

    // -----------------------------------------------------
    // 3. POP-UP / STUDENT INFORMATION FORM
    // -----------------------------------------------------

    function openStudentModal() {
        if (!modal) {
            scrollToSection("#chat-section");
            return;
        }

        modal.hidden = false;
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");

        const firstInput = modal.querySelector(
            "input:not([type='hidden']), select"
        );

        if (firstInput) firstInput.focus();
    }

    function closeStudentModal() {
        if (!modal) return;

        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        modal.hidden = true;
    }

    openModalButtons.forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            openStudentModal();
        });
    });

    closeModalButtons.forEach(button => {
        button.addEventListener("click", closeStudentModal);
    });

    if (modal) {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeStudentModal();
            }
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && modal && !modal.hidden) {
            closeStudentModal();
        }
    });

    if (studentForm) {
        studentForm.addEventListener("submit", event => {
            event.preventDefault();

            const formData = new FormData(studentForm);
            studentInfo = Object.fromEntries(formData.entries());

            closeStudentModal();

            addMessage(
                "Hello! I'm ready to help with your international student finances. " +
                "Tell me whether you need help with tuition payments, sending money home, " +
                "student loans, or managing multiple currencies."
            );

            scrollToSection("#chat-section");
            showNotification("Your information has been added for this session.");
        });
    }

    // -----------------------------------------------------
    // 4. CHAT ASSISTANT
    // -----------------------------------------------------

    async function sendMessage(messageText) {
        const message = messageText.trim();

        if (!message || isWaitingForReply) return;

        addMessage(message, "user");

        if (chatInput) chatInput.value = "";

        setLoading(true);
        const typingIndicator = showTypingIndicator();

        try {
            // Send the message to the Python backend.
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: message,
                    student: studentInfo
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            const data = await response.json();

            if (!data.reply) {
                throw new Error("The server returned no assistant reply.");
            }

            if (typingIndicator) typingIndicator.remove();

            addMessage(data.reply, "assistant");

        } catch (error) {
            console.error("Chat request failed:", error);

            if (typingIndicator) typingIndicator.remove();

            // Temporary offline response for the frontend demo.
            // Real financial guidance will come from the Python backend.
            addMessage(
                getDemoReply(message),
                "assistant"
            );

        } finally {
            setLoading(false);

            if (chatInput) chatInput.focus();
        }
    }

    if (chatForm) {
        chatForm.addEventListener("submit", event => {
            event.preventDefault();

            if (chatInput) {
                sendMessage(chatInput.value);
            }
        });
    }

    // -----------------------------------------------------
    // 5. TEMPORARY DEMO RESPONSES
    // -----------------------------------------------------

    function getDemoReply(message) {
        const text = message.toLowerCase();

        if (
            text.includes("tuition") ||
            text.includes("course fee") ||
            text.includes("university fee")
        ) {
            return "For tuition payments, first check your university's official payment instructions. " +
                "Compare approved payment methods, transfer fees, exchange rates, and payment deadlines. " +
                "Which country will you study in, and where will you pay from?";
        }

        if (
            text.includes("send money") ||
            text.includes("remittance") ||
            text.includes("family") ||
            text.includes("home")
        ) {
            return "To send money home, compare licensed remittance providers using the final amount " +
                "your recipient receives, including fees and exchange rates. Which country are you " +
                "sending money to, and from which country?";
        }

        if (
            text.includes("loan") ||
            text.includes("lender") ||
            text.includes("borrow")
        ) {
            return "International student loans depend on your destination, nationality, university, " +
                "and eligibility. We should compare legitimate lenders, interest rates, repayment " +
                "conditions, and any guarantor requirements. Which country will you study in?";
        }

        if (
            text.includes("currency") ||
            text.includes("exchange rate") ||
            text.includes("multi-currency")
        ) {
            return "For managing multiple currencies, compare conversion fees, exchange-rate markups, " +
                "account charges, and international transfer costs. Which currencies do you need to manage?";
        }

        if (
            text.includes("budget") ||
            text.includes("financial assessment") ||
            text.includes("afford")
        ) {
            return "Let's estimate your study budget. We can consider tuition, accommodation, food, " +
                "transport, available savings, and expected income. Which country will you study in, " +
                "and what is your estimated monthly budget?";
        }

        return "I can help you understand tuition payments, international student loans, " +
            "sending money home, currency management, and study budgets. Tell me your home country, " +
            "destination country, and what you need help with.";
    }

    // -----------------------------------------------------
    // 6. QUICK-QUESTION BUTTONS
    // -----------------------------------------------------

    document.querySelectorAll("[data-prompt]").forEach(button => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.prompt;

            if (prompt) {
                scrollToSection("#chat-section");
                sendMessage(prompt);
            }
        });
    });

    // -----------------------------------------------------
    // 7. VOICE INPUT
    // -----------------------------------------------------

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (voiceButton) {
        if (!SpeechRecognition) {
            voiceButton.addEventListener("click", () => {
                showNotification(
                    "Voice input is not supported in this browser. Please type your message."
                );
            });
        } else {
            const recognition = new SpeechRecognition();

            recognition.lang = "en-US";
            recognition.continuous = false;
            recognition.interimResults = false;

            voiceButton.addEventListener("click", () => {
                try {
                    recognition.start();
                    showNotification("Listening... Please speak now.");
                } catch (error) {
                    showNotification(
                        "Voice input is already running. Please try again shortly."
                    );
                }
            });

            recognition.onresult = event => {
                const transcript = event.results[0][0].transcript;

                if (chatInput) {
                    chatInput.value = transcript;
                    chatInput.focus();
                } else {
                    sendMessage(transcript);
                }
            };

            recognition.onerror = event => {
                console.error("Voice input error:", event.error);
                showNotification(
                    "Voice input failed. Check microphone permission and try again."
                );
            };
        }
    }

    // -----------------------------------------------------
    // 8. MOBILE NAVIGATION
    // -----------------------------------------------------

    if (menuButton && navigation) {
        menuButton.addEventListener("click", () => {
            const isOpen = navigation.classList.toggle("active");

            menuButton.setAttribute("aria-expanded", String(isOpen));
        });

        navigation.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navigation.classList.remove("active");
                menuButton.setAttribute("aria-expanded", "false");
            });
        });
    }

    // -----------------------------------------------------
    // 9. NAVIGATION LINKS
    // -----------------------------------------------------

    document.querySelectorAll("[data-scroll]").forEach(link => {
        link.addEventListener("click", event => {
            const target = link.dataset.scroll;

            if (target) {
                event.preventDefault();
                scrollToSection(target);
            }
        });
    });

    // -----------------------------------------------------
    // 10. INITIAL WELCOME MESSAGE
    // -----------------------------------------------------

    if (chatMessages && chatMessages.children.length === 0) {
        addMessage(
            "Welcome to your AI Financial Assistant! ✨\n\n" +
            "I'm here to help you understand your financial options as an international student.\n\n" +
            "You can ask me about:\n" +
            "• Tuition and course payments\n" +
            "• Sending money to your family\n" +
            "• International student loans\n" +
            "• Multi-currency management\n" +
            "• Study budgets and financial planning"
        );
    }

    console.log("AI Financial Assistant frontend initialized successfully.");
});
