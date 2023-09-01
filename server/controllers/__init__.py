from flask import Blueprint

from server.controllers.auth import auth

api = Blueprint("api", __name__, url_prefix="/api")
api.register_blueprint(auth)
