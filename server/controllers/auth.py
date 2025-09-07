import functools
from urllib.parse import quote_plus, urlencode

from apiflask import APIBlueprint, abort
from flask import current_app as app
from flask import redirect, request, session
from authlib.integrations.flask_client import OAuth


from server import db
from server.config import (
    FRONTEND_URL,
    BACKEND_URL,
    MENTOR_PASS,
    # AUTH0_CLIENT_ID,
    # AUTH0_CLIENT_SECRET,
    # AUTH0_DOMAIN,
    # AUTH_USERNAME,
    # AUTH_PASSWORD,
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET
)
from server.plume.utils import get_info
from server.models import User

auth = APIBlueprint("auth", __name__, url_prefix="/auth")
oauth = OAuth(app)

def is_user_valid(user, valid_roles):
    if not user or not user.role:
        return False
    elif user.role not in valid_roles:
        return False
    return True

oauth.register(
    "discord",
    client_id=DISCORD_CLIENT_ID,
    client_secret=DISCORD_CLIENT_SECRET,
    access_token_url="https://discord.com/api/oauth2/token",
    authorize_url="https://discord.com/api/oauth2/authorize",
    api_base_url="https://discord.com/api/",
    client_kwargs={"scope": "identify email"},
)

def auth_required_decorator(roles):
    """
    middleware for protected routes
    """

    def auth_required(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if "user_id" not in session:
                return abort(401)

            user = User.query.filter_by(id=session["user_id"]).first()
            if not user or not user.role:
                return abort(401)
            elif user.role not in roles:
                return abort(401)
            return func(*args, **kwargs)

        return wrapper

    return auth_required


@auth.route("/login")
def login():
    return_url = request.args.get("return_url", FRONTEND_URL + "/home")
    session["return_url"] = return_url
    return redirect(
        f"https://plume.hackmit.org/login?return_url={quote_plus(FRONTEND_URL + '/api/auth/callback')}"
    )

    # use this when testing with local plume changes
    # return redirect(
    #     f"http://localhost:2003/login?return_url={quote_plus(FRONTEND_URL + '/api/auth/callback')}"
    # )


@auth.route("/callback", methods=["GET", "POST"])
def callback():
    user_id = request.args.get("user_id")
    # print(user_id)
    if not user_id:
        # Redirect to front page with login error
        return redirect(
            f"{FRONTEND_URL}/?error=login_failed&message=User does not exist"
        )
    plume_resp = get_info([user_id])
    if not plume_resp:
        # Redirect to front page with login error
        return redirect(f"{FRONTEND_URL}/?error=login_failed&message=User not found")

    info = plume_resp[user_id]
    session["user_id"] = user_id
    session["user_name"] = info["name"]
    session["user_email"] = info["email"]

    # Check if user exists in qstack database, create if not
    user = User.query.filter_by(id=user_id).first()
    if not user:
        # print("creating user")
        user = User(id=user_id)

        for admin in app.config["AUTH_ADMINS"]:
            if admin["email"] == info["email"]:
                user.role = "admin"

        db.session.add(user)
        db.session.commit()

    # Get the return URL from session, default to FRONTEND_URL/home
    return_url = session.pop("return_url", FRONTEND_URL + "/home")
    return redirect(return_url)


@auth.route("/logout")
def logout():
    session.clear()
    return redirect("https://plume.hackmit.org/logout")

    # uncomment for local
    # return redirect("http://localhost:2003/logout")

@auth.route("/discord/login")
def discord_login():
    if "user_id" not in session:
        print("in here")
        return redirect(FRONTEND_URL + "/api/auth/login")

    return oauth.discord.authorize_redirect(
        redirect_uri=FRONTEND_URL + "/auth/discord/callback"
    )

@auth.route("/discord/exchange-token", methods=["POST"])
def discord_exchange_token():
    data = request.get_json()
    code = data.get("code")
    print("code", code)

    if not code:
        return abort(400, "Missing authorization code")

    # Check if user is logged in via Auth0 first
    if "user_id" not in session:
        return {"success": False, "error": "Must be logged first"}

    try:
        # Exchange code for token using the Discord OAuth client
        token = oauth.discord.fetch_access_token(
            code=code,
            redirect_uri=FRONTEND_URL + "/auth/discord/callback"
        )
        print("got token", token)
        # Get Discord user profile
        resp = oauth.discord.get("users/@me", token=token)
        print("resp", resp)
        profile = resp.json()

        # Extract Discord info
        discord_tag = f"{profile['username']}#{profile['discriminator']}"
        discord_id = profile['id']
        print("discord_tag", discord_tag)

        # Update user in database
        email = session["user_email"]
        print("email session", email)
        user = User.query.filter_by(email=email).first()
        print("user", user)
        print("email", email)

        if not user:
            return {"success": False, "error": "User not found"}

        user.discord = discord_tag
        db.session.commit()
        print("user.discord", user.discord)
        return {"success": True, "discord_tag": discord_tag}

    except Exception as e:
        return {"success": False, "error": str(e)}



@auth.route("/whoami")
def whoami():
    if "user_id" in session:
        user = User.query.filter_by(id=session["user_id"]).first()
        if user:
            return dict(user.map(), loggedIn=True)
    return {"loggedIn": False}


@auth.route("/update", methods=["POST"])
def update():
    if "user_id" not in session:
        return abort(401)

    user = User.query.filter_by(id=session["user_id"]).first()
    if not user:
        return abort(401)

    data = request.get_json()

    if data["role"] == "mentor" and user.role == "hacker":
        if "password" not in data:
            return abort(403, "Missing password!")
        elif data["password"] != MENTOR_PASS:
            return abort(403, "Incorrect password!")
        user.role = "mentor"

    if data["role"] == "hacker":
        user.role = "hacker"

    # if len(data["name"]) == 0:
    #     return abort(400, "Missing name!")
    # session["user_name"] = data["name"]

    if data["location"] == "virtual" and len(data["zoomlink"]) == 0:
        return abort(400, "Missing video call link!")

    if len(data["discord"]) == 0:
        return abort(400, "Missing discord!")

    user.location = data["location"]
    user.zoomlink = data["zoomlink"]
    user.discord = data["discord"]
    db.session.commit()
    return {"message": "Your information has been updated!"}
