import json
from os import environ as env

from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
from apiflask import APIFlask
from flask import redirect, render_template, session, url_for
from flask_sqlalchemy import SQLAlchemy

STATIC_FOLDER = "../client/dist"
FRONTEND_URL = env.get("FRONTEND_URL")

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

app = APIFlask(
    __name__,
    docs_path=None,
    static_folder=STATIC_FOLDER,
    template_folder=STATIC_FOLDER,
    static_url_path="/",
)
app.secret_key = env.get("APP_SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = env.get("SQLALCHEMY_DATABASE_URI")
db = SQLAlchemy(app)

with app.app_context():
    from server.controllers import api

    app.register_blueprint(api)

    from server import models

    db.create_all()

    @app.errorhandler(404)
    def _default(_error):
        return render_template("index.html"), 200
