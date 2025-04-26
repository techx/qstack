import functools
from urllib.parse import quote_plus, urlencode

from apiflask import APIBlueprint, abort
from authlib.integrations.flask_client import OAuth
from flask import current_app as app
from flask import redirect, request, session

from server import db
from server.config import (
    AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET,
    AUTH0_DOMAIN,
    FRONTEND_URL,
    MENTOR_PASS,
)
from server.models import User

auth = APIBlueprint("auth", __name__, url_prefix="/auth")
oauth = OAuth(app)

oauth.register(
    "auth0",
    client_id=AUTH0_CLIENT_ID,
    client_secret=AUTH0_CLIENT_SECRET,
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f"https://{
        AUTH0_DOMAIN}/.well-known/openid-configuration",
)


def is_user_valid(user, valid_roles):
    if not user or not user.role:
        return False
    elif user.role not in valid_roles:
        return False
    return True


def auth_required_decorator(valid_roles):
    """
    middleware for protected routes
    """

    def auth_required(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            email = session["user"]["userinfo"]["email"]
            user = User.query.filter_by(email=email).first()
            if not is_user_valid(user, valid_roles):
                return abort(401)
            return func(*args, **kwargs)

        return wrapper

    return auth_required


@auth.route("/login")
def login():
    return oauth.auth0.authorize_redirect(  # type: ignore
        redirect_uri=FRONTEND_URL + "/api/auth/callback"
    )


@auth.route("/callback", methods=["GET", "POST"])
def callback():
    token = oauth.auth0.authorize_access_token()  # type: ignore
    session["user"] = token
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if not user:
        u = User(
            name=session["user"]["userinfo"]["name"],
            email=session["user"]["userinfo"]["email"],
        )

        for admin in app.config["AUTH_ADMINS"]:
            if admin["email"] == email:
                u.role = "admin"
        db.session.add(u)
        db.session.commit()

    return redirect(FRONTEND_URL)


@auth.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://"
        + AUTH0_DOMAIN
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": FRONTEND_URL,
                "client_id": AUTH0_CLIENT_ID,
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
            return dict(user.map(), loggedIn=True)
    return {"loggedIn": False}


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

    if len(data["name"]) == 0:
        return abort(400, "Missing name!")
    user.name = data["name"]

    if data["location"] == "virtual" and len(data["zoomlink"]) == 0:
        return abort(400, "Missing video call link!")

    if len(data["discord"]) == 0:
        return abort(400, "Missing discord!")

    user.location = data["location"]
    user.zoomlink = data["zoomlink"]
    user.discord = data["discord"]
    db.session.commit()
    return {"message": "Your information has been updated!"}
