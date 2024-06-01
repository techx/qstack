import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(os.path.dirname(__file__) / Path("../.env"))

# from flaskenv
FLASK_RUN_PORT = 3001
DEBUG = True

# CORS configuration
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:6001")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:3001")
ALLOWED_DOMAINS = [FRONTEND_URL]

SQLALCHEMY_DATABASE_URI = os.environ.get(
    "SQLALCHEMY_DATABASE_URI", "postgresql://postgres:password@database/qstackdb"
)

AUTH0_CLIENT_ID = os.environ.get("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.environ.get("AUTH0_CLIENT_SECRET")
AUTH_USERNAME = os.environ.get("AUTH_USERNAME")
AUTH_PASSWORD = os.environ.get("AUTH_PASSWORD")
AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
APP_SECRET_KEY = os.environ.get("APP_SECRET_KEY")
MENTOR_PASS = os.environ.get("MENTOR_PASS")

ENV = os.environ.get("ENVIRONMENT", "development")


AUTH_ADMINS = [
    {"name": "HackMIT", "email": "admin@hackmit.org"},
]