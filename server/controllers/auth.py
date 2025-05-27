from flask import current_app as app, redirect, session, request
from server import db
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from urllib.parse import quote_plus, urlencode
from server.models import User
from server.config import (
    FRONTEND_URL,
    BACKEND_URL,
    MENTOR_PASS,
    AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET,
    AUTH0_DOMAIN,
    AUTH_USERNAME,
    AUTH_PASSWORD,
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET
)

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
        def wrapper(*args, **kwargs):
            email = session["user"]["userinfo"]["email"]
            user = User.query.filter_by(email=email).first()
            if not user or not user.role:
                return abort(401)
            elif user.role not in roles:
                return abort(401)
            return func(*args, **kwargs)

        wrapper.__name__ = (
            func.__name__
        )  # avoid overwriting wrapper. something about scoping issues
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

@auth.route("/discord/login")
def discord_login():
    if "user" not in session:
        return redirect(FRONTEND_URL + "/api/auth/login")

    return oauth.discord.authorize_redirect(
        redirect_uri=FRONTEND_URL + "/auth/discord/callback"
    )

@auth.route("/discord/exchange-token", methods=["POST"])
def discord_exchange_token():
    data = request.get_json()
    code = data.get("code")

    if not code:
        return abort(400, "Missing authorization code")

    # Check if user is logged in via Auth0 first
    if "user" not in session:
        return {"success": False, "error": "Must be logged in via Auth0 first"}

    try:
        # Exchange code for token using the Discord OAuth client
        token = oauth.discord.fetch_access_token(
            code=code,
            redirect_uri=FRONTEND_URL + "/auth/discord/callback"
        )

        # Get Discord user profile
        resp = oauth.discord.get("users/@me", token=token)
        profile = resp.json()

        # Extract Discord info
        discord_tag = f"{profile['username']}#{profile['discriminator']}"
        discord_id = profile['id']

        # Update user in database
        email = session["user"]["userinfo"]["email"]
        user = User.query.filter_by(email=email).first()

        if not user:
            return {"success": False, "error": "User not found"}

        user.discord = discord_tag
        db.session.commit()

        return {"success": True, "discord_tag": discord_tag}

    except Exception as e:
        return {"success": False, "error": str(e)}



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
