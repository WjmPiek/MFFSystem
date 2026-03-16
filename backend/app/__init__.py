import os

from flask import Flask, make_response, request
from flask_cors import CORS

from .extensions import db, migrate
from .models import User
from .routes import api


def _normalize_database_url(database_url):
    if database_url and database_url.startswith('postgres://'):
        return database_url.replace('postgres://', 'postgresql://', 1)
    return database_url


def _parse_allowed_origins():
    raw = os.getenv('FRONTEND_URLS') or os.getenv('FRONTEND_URL') or 'http://localhost:5173'
    origins = []
    for item in raw.split(','):
        origin = item.strip().rstrip('/')
        if origin and origin not in origins:
            origins.append(origin)

    defaults = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://martinsdirect-frontend.onrender.com',
    ]
    for origin in defaults:
        if origin not in origins:
            origins.append(origin)
    return origins


def _ensure_default_admin(app):
    admin_email = os.getenv('ADMIN_EMAIL', 'wjm@martinsdirect.com').strip().lower()
    admin_password = os.getenv('ADMIN_PASSWORD', 'Renette7')
    admin_name = os.getenv('ADMIN_NAME', 'Wjm').strip() or 'Wjm'
    admin_role = (os.getenv('ADMIN_ROLE', 'admin').strip().lower() or 'admin')

    with app.app_context():
        db.create_all()

        existing_user = User.query.filter(db.func.lower(User.email) == admin_email).first()

        if existing_user is None:
            user = User(name=admin_name, email=admin_email, role=admin_role, is_active=True)
            user.set_password(admin_password)
            db.session.add(user)
        else:
            existing_user.name = admin_name
            existing_user.role = admin_role
            existing_user.is_active = True
            existing_user.set_password(admin_password)

        db.session.commit()


def create_app():
    app = Flask(__name__)

    database_url = _normalize_database_url(os.getenv('DATABASE_URL')) or 'sqlite:///app.db'
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')

    allowed_origins = _parse_allowed_origins()
    app.config['ALLOWED_ORIGINS'] = allowed_origins

    CORS(
        app,
        resources={r'/api/*': {'origins': allowed_origins}},
        supports_credentials=True,
        allow_headers=['Content-Type', 'Authorization'],
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        expose_headers=['Content-Type', 'Authorization'],
    )

    @app.before_request
    def _handle_preflight():
        if request.method == 'OPTIONS' and request.path.startswith('/api/'):
            response = make_response('', 204)
            origin = (request.headers.get('Origin') or '').rstrip('/')
            if origin in allowed_origins:
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Allow-Headers'] = request.headers.get(
                    'Access-Control-Request-Headers', 'Content-Type, Authorization'
                )
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                response.headers['Vary'] = 'Origin'
            return response
        return None

    @app.after_request
    def _apply_cors_headers(response):
        if request.path.startswith('/api/'):
            origin = (request.headers.get('Origin') or '').rstrip('/')
            if origin in allowed_origins:
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers.setdefault('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                response.headers.setdefault('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                response.headers['Vary'] = 'Origin'
        return response

    db.init_app(app)
    migrate.init_app(app, db)
    app.register_blueprint(api, url_prefix='/api')

    _ensure_default_admin(app)
    return app
