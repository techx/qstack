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
AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
APP_SECRET_KEY = os.environ.get("APP_SECRET_KEY")
MENTOR_PASS = os.environ.get("MENTOR_PASS")

ENV = os.environ.get("ENVIRONMENT", "development")

# AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
# AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
# AWS_BUCKET_NAME = os.environ.get("AWS_BUCKET_NAME")
# TARGET_IMAGE_PATH = os.environ.get("AWS_TARGET_IMAGE_PATH")