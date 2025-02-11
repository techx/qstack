from server import app, socketio

if __name__ == "__main__":
    port = app.config["FLASK_RUN_PORT"]
    debug = app.config["DEBUG"]
    socketio.run(app, host="0.0.0.0", port=port, debug=debug)  # Use socketio.run instead of app.run
