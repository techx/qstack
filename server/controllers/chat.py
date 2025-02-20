from flask import session, request, redirect, url_for
from flask_socketio import emit, join_room, leave_room
from apiflask import APIBlueprint
from server import socketio
from server.config import FRONTEND_URL

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


@chat.route("/post", methods=["POST"])
def home():
    print("home")
    session.clear()
    if request.is_json:
        data = request.get_json()
        name = data.get("name")
        create = data.get("create", False)

        if not name:
            return {"error": "Please enter a name"}, 400

        if create:
            room = generate_unique_code(4)
            rooms[room] = {"members": 0, "messages": []}
            session["room"] = room
            session["name"] = name
            return {"code": room}, 200

    else:
        name = request.form.get("name")
        code = request.form.get("code")
        join = request.form.get("join", False)

        if not name:
            return {"error": "Please enter a name"}, 400

        if join and not code:
            return {"error": "Please enter a room code"}, 400

        if code not in rooms:
            return {"error": "Room does not exist"}, 404

        session["room"] = code
        session["name"] = name
        return {"success": True}, 200


@chat.route("/room")
def room():
    room = session.get("room")
    if room is None or session.get("name") is None or room not in rooms:
        return redirect(url_for("chat.home"))
    return redirect(url_for("chat.room"))


@socketio.on("message")  # TODO: MOVE THIS TO CHAT.PY
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
