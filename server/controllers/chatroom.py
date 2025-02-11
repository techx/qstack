from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request
from server import db
from server.models import chatroom

class CreateChatRoom(Resource):
    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        admin_id = request.json.get('admin_id')

        chat_room = chatroom.ChatRoom(user_id=user_id, admin_id=admin_id)
        db.session.add(chat_room)
        db.session.commit()
        return {"chat_room_id": chat_room.id}, 201
