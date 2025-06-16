from flask import current_app as app, redirect, session, request
from server import db
# from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from urllib.parse import quote_plus, urlencode
from server.models import User
from server.config import (
    FRONTEND_URL,
    MENTOR_PASS,
    # AUTH0_CLIENT_ID,
    # AUTH0_CLIENT_SECRET,
    # AUTH0_DOMAIN,
    # AUTH_USERNAME,
    # AUTH_PASSWORD
)
from server.plume.utils import get_name, get_email

auth = APIBlueprint("auth", __name__, url_prefix="/auth")
# oauth = OAuth(app)

# oauth.register(
#     "auth0",
#     client_id=AUTH0_CLIENT_ID,
#     client_secret=AUTH0_CLIENT_SECRET,
#     client_kwargs={
#         "scope": "openid profile email",
#     },
#     server_metadata_url=f"https://{
#         AUTH0_DOMAIN}/.well-known/openid-configuration",
# )


def auth_required_decorator(roles):
    """
    middleware for protected routes
    """
    def auth_required(func):
        def wrapper(*args, **kwargs):
            # email = session["user"]["userinfo"]["email"]
            # user = User.query.filter_by(email=email).first()
            if "user_id" not in session:
                return abort(401)
            user = User.query.filter_by(id=session["user_id"]).first()
            if not user or not user.role:
                return abort(401)
            elif user.role not in roles:
                return abort(401)
            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    return auth_required


@auth.route("/login")
def login():
    # return oauth.auth0.authorize_redirect(  # type: ignore
    #     redirect_uri=FRONTEND_URL + "/api/auth/callback"
    # )
    # Get the return URL from query parameters, default to FRONTEND_URL
    return_url = request.args.get("return_url", FRONTEND_URL)
    # Store the return URL in session for use after login
    session["return_url"] = return_url
    # Redirect to Plume login page with return URL
    return redirect(f"https://plume.hackmit.org/login?return_url={quote_plus(return_url)}")


@auth.route("/callback", methods=["GET", "POST"])
def callback():
    # token = oauth.auth0.authorize_access_token()  # type: ignore
    # session["user"] = token
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
    # if not user:
    #     u = User(
    #         name=session["user"]["userinfo"]["name"],
    #         email=session["user"]["userinfo"]["email"],
    #     )

    #     for admin in app.config["AUTH_ADMINS"]:
    #         if admin["email"] == email:
    #             u.role = "admin"
    #     db.session.add(u)
    #     db.session.commit()

    # Get user ID from Plume session
    user_id = request.args.get("user_id")
    if not user_id:
        return abort(401, "No user ID provided")
    
    # Store user ID in session
    session["user_id"] = user_id
    
    # Check if user exists in our database
    user = User.query.filter_by(id=user_id).first()
    if not user:
        # Create new user with default role as hacker
        user = User(id=user_id)
        db.session.add(user)
        db.session.commit()
    
    # Get the return URL from session, default to FRONTEND_URL
    return_url = session.pop("return_url", FRONTEND_URL)
    return redirect(return_url)


@auth.route("/logout")
def logout():
    session.clear()
    # return redirect(
    #     "https://"
    #     + AUTH0_DOMAIN
    #     + "/v2/logout?"
    #     + urlencode(
    #         {
    #             "returnTo": FRONTEND_URL,
    #             "client_id": AUTH0_CLIENT_ID,
    #         },
    #         quote_via=quote_plus,
    #     )
    # )
    return redirect("https://plume.hackmit.org/logout")


@auth.route("/whoami")
def whoami():
    # if "user" in session:
    #     email = session["user"]["userinfo"]["email"]
    #     user = User.query.filter_by(email=email).first()
    #     if user:
    #         return dict(user.map(), loggedIn=True)
    if "user_id" in session:
        user = User.query.filter_by(id=session["user_id"]).first()
        if user:
            user_data = dict(user.map())
            # Add name and email from Plume
            user_data["name"] = get_name(user.id)
            user_data["email"] = get_email(user.id)
            user_data["loggedIn"] = True
            return user_data
    return {"loggedIn": False}


@auth.route("/update", methods=["POST"])
def update():
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
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
    # user.name = data["name"]

    if data["location"] == "virtual" and len(data["zoomlink"]) == 0:
        return abort(400, "Missing video call link!")

    if len(data["discord"]) == 0:
        return abort(400, "Missing discord!")

    user.location = data["location"]
    user.zoomlink = data["zoomlink"]
    user.discord = data["discord"]
    db.session.commit()
    return {"message": "Your information has been updated!"}
