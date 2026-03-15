import os

from flask import Flask
from flask_cors import CORS

from .extensions import db, migrate
from .models import User
from .permissions import normalize_role
from .routes import api


def _normalize_database_url(database_url):
    if database_url and database_url.startswith('postgres://'):
        return database_url.replace('postgres://', 'postgresql://', 1)
    return database_url


def _ensure_default_admin(app):
    admin_email = os.getenv('ADMIN_EMAIL', 'wjm@martinsdirect.com').strip().lower()
    admin_password = os.getenv('ADMIN_PASSWORD', 'Renette7')
    admin_name = os.getenv('ADMIN_NAME', 'Wjm').strip() or 'Wjm'
    admin_role = normalize_role(os.getenv('ADMIN_ROLE', 'admin'))

    with app.app_context():
        db.create_all()
        existing_user = User.query.filter(db.func.lower(User.email) == admin_email).first()
        if existing_user is None:
            user = User(name=admin_name, email=admin_email, role=admin_role, is_active=True)
            user.set_password(admin_password)
            db.session.add(user)
            db.session.commit()
        else:
            changed = False
            if existing_user.role != admin_role:
                existing_user.role = admin_role
                changed = True
            if not existing_user.is_active:
                existing_user.is_active = True
                changed = True
            if changed:
                db.session.commit()


def create_app():
    app = Flask(__name__)

    database_url = _normalize_database_url(os.getenv('DATABASE_URL')) or 'sqlite:///app.db'
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')

    frontend_url = os.getenv('FRONTEND_URL')
    cors_origins = [frontend_url] if frontend_url else '*'
    CORS(app, resources={r'/api/*': {'origins': cors_origins}})

    db.init_app(app)
    migrate.init_app(app, db)
    app.register_blueprint(api, url_prefix='/api')

    _ensure_default_admin(app)
    return app
