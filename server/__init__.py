import json
from os import environ as env

from authlib.integrations.flask_client import OAuth
from apiflask import APIFlask
from flask import redirect, render_template, session, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from server.config import APP_SECRET_KEY

STATIC_FOLDER = "../client/dist"

app = APIFlask(
    __name__,
    docs_path=None,
    static_folder=STATIC_FOLDER,
    template_folder=STATIC_FOLDER,
    static_url_path="/",
)

db = SQLAlchemy()

app.secret_key = APP_SECRET_KEY
app.config.from_pyfile("config.py")

socketio = SocketIO(app, cors_allowed_origins="*")


with app.app_context():
    from server.controllers import api

    app.register_blueprint(api)

    from server import models

    db.init_app(app)
    db.create_all()

    @app.errorhandler(404)
    def _default(_error):
        return render_template("index.html"), 200
