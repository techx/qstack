from server.config import FRONTEND_URL
from flask import (
    current_app as app,
    Flask,
    url_for,
    redirect,
    session,
    request,
    send_file,
    jsonify,
)
from flask_socketio import emit, join_room, leave_room, send, SocketIO
from server import db, socketio
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from os import environ as env
from server.models import User
from server.models.chatroom import Chatroom

import random
from string import ascii_uppercase

chat = APIBlueprint("chat", __name__, url_prefix="/chat")


rooms = {}


def generate_unique_code(length):
    while True:
        code = ""
        for _ in range(length):
            code += random.choice(ascii_uppercase)

        if code not in rooms:
            break

    return code


# @chat.route("/", methods=["POST", "GET"])
# def home():
#     session.clear()
#     if request.method == "POST":
#         name = request.form.get("name")
#         code = request.form.get("code")
#         join = request.form.get("join", False)
#         create = request.form.get("create", False)

#         if not name:
#             return redirect(FRONTEND_URL)

#             # return render_template("home.html", error="Please enter a name.", code=code, name=name)

#         if join is not False and not code:
#             return redirect(FRONTEND_URL)

#             # return render_template("home.html", error="Please enter a room code.", code=code, name=name)

#         room = code
#         if create is not False:
#             room = generate_unique_code(4)
#             rooms[room] = {"members": 0, "messages": []}
#         elif code not in rooms:
#             return redirect(FRONTEND_URL)

#             # return render_template("home.html", error="Room does not exist.", code=code, name=name)

#         session["room"] = room
#         session["name"] = name
#         return redirect(url_for("room"))


# @chat.route("/room")
# def room():
#     room = session.get("room")
#     if room is None or session.get("name") is None or room not in rooms:
#         return redirect(url_for("home"))

#     return redirect(url_for("room"))
#     # return render_template("room.html", code=room, messages=rooms[room]["messages"])


@socketio.on("message")  # TODO: MOVE THIS TO CHAT.PY
def message(data):
    room = session.get("room")
    if room not in rooms:
        return

    content = {"name": session.get("name"), "message": data["data"]}
    emit("message", content, to=room)
    rooms[room]["messages"].append(content)
    print(f"{session.get('name')} said: {data['data']}")


@socketio.on("join")
def handle_join(data):
    """Handles when a user joins a chat room."""
    room = data.get("code")  # Get room code from frontend
    name = data.get("name")

    if not room or not name:
        return  # Ignore invalid join requests

    if room not in rooms:
        rooms[room] = {"members": 0, "messages": []}

    join_room(room)
    rooms[room]["members"] += 1

    # Notify others in the room
    emit(
        "message",
        {"name": "System", "message": f"{name} has joined the room."},
        to=room,
    )
    print(f"{name} joined room {room}")


@socketio.on("leave")
def handle_leave(data):
    """Handles when a user leaves a chat room."""
    room = data.get("code")  # Get room code from frontend
    name = data.get("name")

    if not room or not name:
        return

    leave_room(room)
    rooms[room]["members"] -= 1

    # Remove room if empty
    if rooms[room]["members"] <= 0:
        del rooms[room]

    emit(
        "message", {"name": "System", "message": f"{name} has left the room."}, to=room
    )
    print(f"{name} left room {room}")


@socketio.on("connect")
def connect(auth):
    print("client connected")
    room = session.get("room")
    name = session.get("name")
    if not room or not name:
        return
    if room not in rooms:
        leave_room(room)
        return

    join_room(room)
    emit("message", {"name": name, "message": "has entered the room"}, to=room)
    rooms[room]["members"] += 1
    print(f"{name} joined room {room}")


@socketio.on("disconnect")
def disconnect():
    room = session.get("room")
    name = session.get("name")
    leave_room(room)

    if room in rooms:
        rooms[room]["members"] -= 1
        if rooms[room]["members"] <= 0:
            del rooms[room]

    emit("message", {"name": name, "message": "has left the room"}, to=room)
    print(f"{name} has left the room {room}")
