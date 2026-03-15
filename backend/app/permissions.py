from functools import wraps

from flask import current_app, g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .models import User


ALLOWED_ROLES = {'admin', 'franchisee', 'user'}


def normalize_role(role: str) -> str:
    role = (role or 'user').strip().lower()
    if role in {'superuser', 'administrator'}:
        return 'admin'
    return role if role in ALLOWED_ROLES else 'user'


def make_serializer(secret_key: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(secret_key, salt='martinsdirect-auth')


def create_auth_token(secret_key: str, user: User) -> str:
    serializer = make_serializer(secret_key)
    return serializer.dumps({'user_id': user.id, 'role': normalize_role(user.role)})


def get_current_user(secret_key: str, max_age: int = 60 * 60 * 24 * 7):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split(' ', 1)[1].strip()
    if not token:
        return None

    serializer = make_serializer(secret_key)
    try:
        payload = serializer.loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None

    user_id = payload.get('user_id')
    if not user_id:
        return None

    user = User.query.get(user_id)
    if not user or not user.is_active:
        return None

    user.role = normalize_role(user.role)
    return user


def auth_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = get_current_user(current_app.config['SECRET_KEY'])
        if not user:
            return jsonify({'error': 'Authentication required.'}), 401
        g.current_user = user
        return view(*args, **kwargs)

    return wrapped


def roles_required(*roles):
    required = {normalize_role(role) for role in roles}

    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            user = get_current_user(current_app.config['SECRET_KEY'])
            if not user:
                return jsonify({'error': 'Authentication required.'}), 401
            g.current_user = user
            if normalize_role(user.role) not in required:
                return jsonify({'error': 'You do not have permission to perform this action.'}), 403
            return view(*args, **kwargs)

        return wrapped

    return decorator
