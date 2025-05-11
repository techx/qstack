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
from time import time
from math import floor

from server import socketio
from server.config import FRONTEND_URL
from server.controllers.auth import is_user_valid
from server.models.ticket import Ticket
from server.models.user import User

chat = APIBlueprint("chat", __name__, url_prefix="/chat")


def fmt_room_name(ticket_id):
    return f"ticket-{ticket_id}"


def force_disconnect_later(client_sid, room=None):
    socketio.sleep(0.5) # Give the close message a chance to go out
    socketio.server.disconnect(client_sid)


def close_room_later(room):
    socketio.sleep(0.5)
    print("closing room", room)
    for sid, _ in socketio.server.manager.get_participants("/", room):
        socketio.server.disconnect(sid)
    socketio.close_room(room)


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


def close_ticket_room(ticket_id, message):
    ts = floor(time())
    message_data = {"ts": ts, "message": message}
    room_name = fmt_room_name(ticket_id)
    emit("system_message", message_data, to=room_name, namespace="/")
    socketio.start_background_task(close_room_later, room_name)


def setup_ticket_chat():
    def delayed_disconnect(client_sid):
        socketio.start_background_task(force_disconnect_later, client_sid)

    valid_roles = ["hacker", "mentor", "admin"]
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if not is_user_valid(user, valid_roles):
        emit("open_chat_error", {"message": "Unauthorized"})
        delayed_disconnect(request.sid)
        return

    ticket = get_user_ticket(user)
    if not ticket:
        emit("open_chat_error", {"message": "No active ticket"})
        delayed_disconnect(request.sid)
        return

    room = fmt_room_name(ticket.id)
    name = user.role
    return user, ticket, room, name


def chat_partner_metadata(user, ticket):
    if user.role == "hacker":
        mentor_name = ticket.claimant.name if ticket.claimant else "Unknown"
        return mentor_name, "Mentor"

    if user.role in ("mentor", "admin"):
        creator = User.query.get(ticket.creator_id)
        creator_name = creator.name if creator else "Unknown"
        return creator_name, "Hacker"

    raise AssertionError(f"unepxected role {user.role!r}")


@socketio.on("connect")
def connect_handler(_auth=None):
    ctx = setup_ticket_chat()
    if ctx is None:
        return
    user, ticket, room, name = ctx
    join_room(room)
    name, role = chat_partner_metadata(user, ticket)
    emit("partner_metadata", {"name": name, "role": role})
    print(f"{name} joined {room}")


@socketio.on("send_message")
def message_handler(data):
    if not isinstance(data, dict) or "content" not in data:
        return
    content = data["content"]

    ctx = setup_ticket_chat()
    if ctx is None:
        return
    _, _, room, name = ctx

    ts = floor(time())
    message_data = {"name": name, "ts": ts, "message": content}
    emit("recv_message", message_data, to=room, include_self=False)
    print(f"{name} in {room} said: {content}")
    return {"ts": ts}


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
