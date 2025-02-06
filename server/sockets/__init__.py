from flask_socketio import join_room, leave_room, send, SocketIO

socketio = SocketIO(app)

    socketio.run(app, debug=True)
