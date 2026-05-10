from flask import Blueprint, request, jsonify
import json
import os

import random
import os

from flask_mail import Message
from flask_mail import Mail

SESSIONS_FILE = "sessions.json"

auth_bp = Blueprint("auth", __name__)

USERS_FILE = "users.json"

otp_store = {}


def load_users():

    if not os.path.exists(USERS_FILE):
        return []

    with open(USERS_FILE, "r") as f:
        return json.load(f)


def save_users(users):

    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():

    data = request.json

    email = data["email"]

    otp = str(
        random.randint(100000, 999999)
    )

    otp_store[email] = otp

    msg = Message(
        "Smart Analytics Verification OTP",
        recipients=[email]
    )

    msg.body = f"""
Your Smart Analytics OTP is:

{otp}

Valid for 5 minutes.
"""

    from flask import current_app

    mail = current_app.extensions["mail"]

    mail.send(msg)

    return jsonify({
        "message": "OTP sent"
    })

@auth_bp.route("/signup", methods=["POST"])
def signup():

    data = request.json

    email = data["email"]

    otp = data.get("otp")

    saved_otp = otp_store.get(email)

    if not saved_otp or otp != saved_otp:

        return jsonify({
            "error": "Invalid OTP"
        }), 401

    users = load_users()

    exists = any(
        u["email"] == data["email"]
        for u in users
    )

    if exists:
        return jsonify({
            "error": "User already exists"
        }), 400

    user = {
        "id": len(users) + 1,
        "name": data["name"],
        "email": data["email"],
        "password": data["password"]
    }

    users.append(user)

    save_users(users)

    return jsonify({
        "message": "Signup successful",
        "user": user
    })

def load_sessions():

    if not os.path.exists(SESSIONS_FILE):
        return []

    with open(SESSIONS_FILE, "r") as f:
        return json.load(f)


def save_sessions(data):

    with open(SESSIONS_FILE, "w") as f:
        json.dump(data, f, indent=2)


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.json

    users = load_users()

    user = next(
        (
            u for u in users
            if (
                u["email"] == data["email"]
                and
                u["password"] == data["password"]
            )
        ),
        None
    )

    if not user:
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    return jsonify({
        "message": "Login successful",
        "user": user
    })

@auth_bp.route("/save-session", methods=["POST"])
def save_session():

    data = request.json

    sessions = load_sessions()

    sessions.append(data)

    save_sessions(sessions)

    return jsonify({
        "message": "Session saved"
    })