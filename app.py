
from flask import Flask, request, jsonify
from flask_cors import CORS


import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Hello, Claude",
        }
    ],
)
for block in message.content:
    if block.type == "text":
        print(block.text)







app = Flask(__name__)
CORS(app)


def generate_reply(message, student=None):
    """Generate a basic financial guidance response."""

    message = message.lower().strip()

    if any(word in message for word in ["tuition", "university fee", "course fee"]):
        return (
            "For tuition payments, first check your university's official "
            "payment instructions. Compare approved bank transfers, "
            "international payment services, fees, exchange rates, and "
            "payment deadlines before choosing an option."
        )

    elif any(word in message for word in ["send money", "remittance", "family", "home country"]):
        return (
            "To send money home, compare regulated transfer providers and "
            "banks. Check the exchange rate, transfer fee, delivery time, "
            "recipient details, and any transfer limits. Use a provider "
            "authorized in your country."
        )

    elif any(word in message for word in ["loan", "lender", "borrow", "student finance"]):
        return (
            "When exploring student loans, check international-student "
            "eligibility, interest rates, repayment terms, guarantor "
            "requirements, and total repayment cost. Compare official "
            "lenders carefully, and never pay an unknown person to "
            "guarantee loan approval."
        )

    elif any(word in message for word in ["currency", "exchange rate", "multi-currency", "convert"]):
        return (
            "For managing multiple currencies, compare regulated "
            "multi-currency accounts, bank accounts, and payment cards. "
            "Check conversion fees, exchange-rate margins, ATM charges, "
            "and account eligibility in your country. I do not have "
            "live exchange-rate data yet."
        )

    elif any(word in message for word in ["budget", "expenses", "spending", "save money"]):
        return (
            "Start by listing your available funds and monthly expenses: "
            "tuition, rent, food, transport, insurance, and emergencies. "
            "Separate essential expenses from optional spending and "
            "review your budget every month."
        )

    elif any(word in message for word in ["credit score", "credit history", "build credit"]):
        return (
            "To understand credit building, first check the rules in your "
            "study country. If eligible, use a suitable bank account or "
            "credit product responsibly, pay bills on time, and avoid "
            "borrowing more than you can repay."
        )

    elif any(word in message for word in ["hello", "hi", "hey"]):
        return (
            "Hello! Welcome to your Financial Assistant. I can help you "
            "understand tuition payments, remittances, student loans, "
            "currency management, and budgeting. What would you like "
            "to explore?"
        )

    else:
        return (
            "I can help you explore student financial topics, including "
            "tuition payments, sending money home, international student "
            "loans, budgeting, and multi-currency options. Please tell "
            "me your study country and what you want to understand."
        )


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "message": "Financial Assistant backend is running."
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}

    message = data.get("message", "")
    student = data.get("student", {})

    if not isinstance(message, str) or not message.strip():
        return jsonify({
            "reply": "Please enter a message so I can help you."
        }), 400

    if not isinstance(student, dict):
        student = {}

    reply = generate_reply(message, student)

    return jsonify({
        "reply": reply
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
