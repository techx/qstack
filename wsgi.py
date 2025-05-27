from server import app

if __name__ == "__main__":
    port = app.config["FLASK_RUN_PORT"]
    debug = app.config["DEBUG"]
    app.run(host="0.0.0.0", port=port, debug=debug)
