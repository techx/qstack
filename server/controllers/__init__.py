from flask import Blueprint

from server.controllers.auth import auth
from server.controllers.ticket import ticket

api = Blueprint("api", __name__, url_prefix="/api")

api.register_blueprint(auth)
api.register_blueprint(ticket)
