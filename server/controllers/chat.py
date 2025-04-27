from apiflask import APIBlueprint
from flask import current_app, redirect, request, session, url_for
from flask_socketio import (
    ConnectionRefusedError,
    close_room,
    disconnect,
    emit,
    join_room,
    leave_room,
)

from server import socketio
from server.config import FRONTEND_URL
from server.controllers.auth import is_user_valid
from server.models.ticket import Ticket
from server.models.user import User

chat = APIBlueprint("chat", __name__, url_prefix="/chat")


def fmt_room_name(ticket_id):
    return f"ticket-{ticket_id}"


def force_disconnect_later(client_sid, room=None):
    socketio.sleep(0.5)  # Give the close message a chance to go out
    socketio.server.disconnect(client_sid)


def get_user_ticket(user):
    if user.role == "hacker":
        if user.ticket_id is None:
            return None
        ticket = Ticket.query.get(user.ticket_id)
        if not ticket or ticket.active:
            return None
        return ticket

    if user.role in ("mentor", "admin"):
        return Ticket.query.where(
            Ticket.claimant_id == user.id and Ticket.status == "claimed"
        ).first()
    raise AssertionError(f"unepxected role {user.role!r}")


def setup_ticket_chat():
    def delayed_disconnect(client_sid):
        socketio.start_background_task(lambda: force_disconnect_later(client_sid))

    valid_roles = ["hacker", "mentor", "admin"]
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if not is_user_valid(user, valid_roles):
        emit("error", {"message": "unauthorized"})
        delayed_disconnect(request.sid)
        return

    ticket = get_user_ticket(user)
    if not ticket:
        emit("error", {"message": "no active ticket"})
        delayed_disconnect(request.sid)
        return

    room = fmt_room_name(ticket.id)
    name = user.role
    return room, name


@socketio.on("connect")
def connect_handler(_auth=None):
    ctx = setup_ticket_chat()
    if ctx is None:
        return
    room, name = ctx
    join_room(room)
    print(f"{name} joined {room}")


@socketio.on("message")
def message_handler(data):
    ctx = setup_ticket_chat()
    if ctx is None:
        return
    room, name = ctx
    content = {"name": name, "message": data["data"]}
    emit("message", content, to=room)
    print(f"{name} in {room} said: {data['data']}")


@socketio.on("disconnect")
def disconnect_handler():
    valid_roles = ["hacker", "mentor", "admin"]
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if not is_user_valid(user, valid_roles):
        return

    ticket = get_user_ticket(user)
    if not ticket:
        return

    room = fmt_room_name(ticket.id)
    name = user.role
    print(f"{name} has left the room {room}")
