
import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["https://falcoonai.github.io"]
        }
    }
)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured.")

client = genai.Client(api_key=api_key)

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "message": "Student Finance Assistant backend is running."
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Please enter a message."}), 400

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=(
                "You are StudentFinanceAI, an assistant for "
                "international students. Help with tuition payments, "
                "international remittances, student loans, and "
                "multi-currency options. Ask for the relevant countries "
                "when needed. Do not invent rates, eligibility rules, "
                "or financial terms. Encourage users to verify details "
                "with official providers.\n\n"
                f"User message: {message}"
            )
        )

        return jsonify({
            "reply": response.text or "I couldn't generate a response."
        })

    except Exception:
        app.logger.exception("Gemini request failed")
        return jsonify({
            "error": "The AI service is temporarily unavailable. Please try again."
        }), 502
