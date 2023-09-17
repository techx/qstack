from flask import Blueprint

from server.controllers.auth import auth
from server.controllers.ticket import ticket
from server.controllers.queue import queue


api = Blueprint("api", __name__, url_prefix="/api")

api.register_blueprint(auth)
api.register_blueprint(ticket)
api.register_blueprint(queue)
