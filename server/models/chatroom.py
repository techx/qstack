from flask_socketio import emit, join_room

@socketio.on('send_message')
def handle_send_message(data):
    token = request.args.get('token')
    user_id = decode_jwt(token)
    chat_room_id = data['chat_room_id']
    message_content = data['message']
    sender_type = data['sender_type']
    admin_id = data.get('admin_id')

    chat_room = ChatRoom.query.get(chat_room_id)
    if chat_room:
        new_message = Message(content=message_content, user_id=user_id, sender_type=sender_type, admin_id=admin_id, chatroom_id=chat_room_id, timestamp=datetime.utcnow())
        db.session.add(new_message)
        db.session.commit()

        print(new_message)
        new_message_id = new_message.id
        emit('new_message', {'id': new_message_id, 'content': message_content, "sender_type": sender_type}, room=data['chat_room_id'])
        print(message_content)

@socketio.on('join_room')
def on_join(data):
    room = data['chat_room_id']
    join_room(room)
    emit('room_notification', {'message': 'A new user has joined.'}, room=room)