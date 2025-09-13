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
from server.plume.utils import get_info

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
    print("session id setup", session["user_id"])
    user = User.query.filter_by(id=session["user_id"]).first()
    print("user", user)
    if not is_user_valid(user, valid_roles):
        emit("open_chat_error", {"message": "Unauthorized"})
        delayed_disconnect(request.sid)
        return

    ticket = get_user_ticket(user)
    print("ticket in setup", ticket)
    if not ticket:
        emit("open_chat_error", {"message": "No active ticket"})
        delayed_disconnect(request.sid)
        return

    room = fmt_room_name(ticket.id)
    name = user.role
    return user, ticket, room, name


def chat_partner_metadata(user, ticket):
    if user.role == "hacker":
        print("ticket", ticket)
        print("ticket.claimant", ticket.claimant)
        creator_id = ticket.claimant.id if ticket.claimant else "Unknown"
        print("creator_id", creator_id)
        creator_info = get_info([creator_id])
        print("creator info ticket claimant", creator_info)
        return creator_info[creator_id]["name"], "Mentor"
    if user.role in ("mentor", "admin"):
        print("ticket", ticket)
        print("ticket.creator", ticket.creator)
        creator_id = ticket.creator.id if ticket.creator else "Unknown"
        print("creator id", creator_id)
        creator_info = get_info([creator_id])
        print("creator info ticket creator", creator_info)
        return creator_info[creator_id]["name"], "Hacker"

    raise AssertionError(f"unepxected role {user.role!r}")


@socketio.on("connect")
def connect_handler(_auth=None):
    ctx = setup_ticket_chat()
    if ctx is None:
        return
    user, ticket, room, name = ctx
    join_room(room)
    partner_name, role = chat_partner_metadata(user, ticket)
    print("connect", partner_name, role)
    emit("partner_metadata", {"name": partner_name, "role": role})
    
    from server.plume.utils import get_info
    user_info = get_info([user.id])
    actual_name = user_info[user.id]["name"] if user.id in user_info else user.role
    
    ts = floor(time())
    join_message = f"{actual_name} joined"
    join_data = {"ts": ts, "message": join_message}
    emit("system_message", join_data, to=room, include_self=False)


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
    # email = session["user"]["userinfo"]["email"]
    # email = session["user_email"]
    # user = User.query.filter_by(email=email).first()
    user_id = session["user_id"]
    user = User.query.filter_by(id=user_id).first()
    if not is_user_valid(user, valid_roles):
        return

    ticket = get_user_ticket(user)
    if not ticket:
        return

    room = fmt_room_name(ticket.id)
    name = user.role
    print(f"{name} has left the room {room}")
