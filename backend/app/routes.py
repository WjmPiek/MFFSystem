from flask import Blueprint, jsonify, request
from .extensions import db
from .models.user import User

api = Blueprint("api", __name__)

@api.get("/users")
def get_users():
    users = User.query.order_by(User.id.desc()).all()
    return jsonify([
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        }
        for user in users
    ]), 200

@api.post("/users")
def create_user():
    data = request.get_json() or {}

    email = data.get("email")
    password_hash = data.get("password_hash")
    role = data.get("role", "user")
    is_active = data.get("is_active", True)

    if not email or not password_hash or not role:
        return jsonify({
            "error": "email, password_hash, and role are required"
        }), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "email already exists"}), 409

    user = User(
        email=email,
        password_hash=password_hash,
        role=role,
        is_active=is_active,
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }), 201

@api.delete("/users/<int:user_id>")
def delete_user(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "user not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "user deleted"}), 200