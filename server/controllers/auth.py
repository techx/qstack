from flask import current_app as app, url_for, redirect, session, request
from server import db
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from os import environ as env
from urllib.parse import quote_plus, urlencode
from server.models import User

FRONTEND_URL = env.get("FRONTEND_URL")
MENTOR_PASS = env.get("MENTOR_PASS")

auth = APIBlueprint("auth", __name__, url_prefix="/auth")
oauth = OAuth(app)

oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration',
)


@auth.route("/login")
def login():
    return oauth.auth0.authorize_redirect(
        redirect_uri=FRONTEND_URL + "/api/auth/callback"
    )


@auth.route("/callback", methods=["GET", "POST"])
def callback():
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if not user:
        u = User(
            name=session["user"]["userinfo"]["name"],
            email=session["user"]["userinfo"]["email"],
        )
        db.session.add(u)
        db.session.commit()

    return redirect(FRONTEND_URL)


@auth.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://"
        + env.get("AUTH0_DOMAIN")
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": FRONTEND_URL,
                "client_id": env.get("AUTH0_CLIENT_ID"),
            },
            quote_via=quote_plus,
        )
    )


@auth.route("/whoami")
def whoami():
    if "user" in session:
        email = session["user"]["userinfo"]["email"]
        user = User.query.filter_by(email=email).first()
        if user:
            return user.map()
    return {}


@auth.route("/update", methods=["POST"])
def update():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    data = request.get_json()

    if data["role"] == "mentor" and user.role == "hacker":
        if "password" not in data:
            return abort(403, "Missing password!")
        elif data["password"] != MENTOR_PASS:
            return abort(403, "Incorrect password!")

        user.role = "mentor"

    if data["role"] == "hacker":
        user.role = "hacker"
    if "name" in data:
        user.name = data["name"]

    db.session.commit()
    return {"message": "Your information has been updated!"}
