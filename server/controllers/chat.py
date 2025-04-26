from flask import session, request, redirect, url_for
from flask_socketio import emit, join_room, leave_room
from apiflask import APIBlueprint
from server import socketio
from server.config import FRONTEND_URL
from server.controllers.auth import is_user_valid
from server.models.user import User

chat = APIBlueprint("chat", __name__, url_prefix="/chat")

@socketio.on("connect")
def chat_connect():
    valid_roles = ["hacker", "mentor", "admin"]
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if not is_user_valid(user, valid_roles):
        return abort(401)

@socketio.on("message")
def message(data):
    room = session.get("room")
    if room not in rooms:
        return

    content = {"name": session.get("name"), "message": data["data"]}
    emit("message", content, to=room)
    rooms[room]["messages"].append(content)
    print(f"{session.get('name')} said: {data['data']}")


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
