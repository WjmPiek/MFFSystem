import os
from flask import Flask
from flask_cors import CORS
from .routes import api
from .extensions import db, migrate

def create_app():
    app = Flask(__name__)

    database_url = os.getenv("DATABASE_URL")
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    if not database_url:
        database_url = "sqlite:///app.db"

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")

    CORS(app)

    db.init_app(app)
    migrate.init_app(app, db)
    
    from . import models

    app.register_blueprint(api, url_prefix="/api")

    return app