from flask import current_app as app, url_for, redirect, session, request, send_file, jsonify
from server import db
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from os import environ as env
from urllib.parse import quote_plus, urlencode
import csv
from server.models import User, Ticket
from server.controllers.auth import auth_required_decorator

ticket = APIBlueprint("ticket", __name__, url_prefix="/ticket")


@ticket.route("/tagslist")
def tagslist():
    tags = []
    with open("./server/data/tagslist.csv", "r") as file:
        reader = csv.reader(file)
        fields = next(reader)
        for tag in reader:
            tags.append(tag[0])

    return tags


@ticket.route("/save", methods=["POST"])
@auth_required_decorator(roles=["hacker", "admin"])
def save():
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
    user = User.query.filter_by(id=session["user_id"]).first()

    data = request.get_json()
    if (
        len(data["question"]) == 0
        or len(data["content"]) == 0
        or len(data["location"]) == 0
    ):
        return abort(404, "Make sure to fill every field!")

    if not user.ticket_id:
        ticket = Ticket(user, session["user_name"], data, False)
        db.session.add(ticket)
        db.session.commit()
        user.ticket_id = ticket.id
    else:
        ticket = Ticket.query.get(user.ticket_id)
        ticket.update(data)

    db.session.commit()

    return {"message": "Ticket has been updated."}


@ticket.route("/submit", methods=["POST"])
@auth_required_decorator(roles=["hacker", "admin"])
def submit():
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
    user = User.query.filter_by(id=session["user_id"]).first()
    if not user:
        return abort(401, "User not found or not logged in.")

    if len(session["user_name"]) == 0:
        return abort(404, "Update name in profile page before submitting!")

    if user.ticket_id:
        ticket = Ticket.query.get(user.ticket_id)
        if ticket.active:
            return abort(404, "User already has an active ticket!")

    data = request.get_json()

    if (
        len(data["question"]) == 0
        or len(data["content"]) == 0
        or len(data["location"]) == 0
    ):
        return abort(404, "Make sure to fill every field!")

    ticket = Ticket(user, session["user__name"], data, True)
    db.session.add(ticket)
    db.session.commit()

    user.ticket_id = ticket.id
    db.session.commit()

    return {"message": "Ticket has been created."}


@ticket.route("/get")
@auth_required_decorator(roles=["hacker", "mentor", "admin"])
def get():
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
    user = User.query.filter_by(id=session["user_id"]).first()

    if not user.ticket_id:
        return jsonify({"active": False})

    ticket = Ticket.query.get(user.ticket_id)
    if not ticket.active:
        return jsonify({"active": False, "ticket": ticket.map()}), 200

    ticket = Ticket.query.get(user.ticket_id)
    return jsonify({"active": True, "ticket": ticket.map()}), 200


@ticket.route("/remove", methods=["POST"])
@auth_required_decorator(roles=["hacker", "admin"])
def remove():
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
    user = User.query.filter_by(id=session["user_id"]).first()

    if not user.ticket_id:
        return abort(404, "No active ticket!")

    ticket = Ticket.query.get(user.ticket_id)

    delete = bool(request.get_json()["del"])
    if delete:
        db.session.delete(ticket)

    ticket.active = False
    db.session.commit()
    return {"message": "Ticket has been removed!"}


@ticket.route("/status")
@auth_required_decorator(roles=["mentor", "hacker", "admin"])
def status():
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
    user = User.query.filter_by(id=session["user_id"]).first()

    if not user.ticket_id:
        return {"status": "unclaimed", "message": "No ticket!"}

    ticket = Ticket.query.get(user.ticket_id)
    if not ticket.claimant_id:
        return {"status": "unclaimed", "message": "Ticket not claimed!"}

    mentor = User.query.get(ticket.claimant_id)
    if ticket.status == "awaiting_feedback":
        return {"status": "awaiting_feedback", "mentorData": mentor.map()}

    return {"status": "claimed", "mentorData": mentor.map()}


@ticket.route("/unclaim")
@auth_required_decorator(roles=["mentor", "admin"])
def unclaim():
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
    user = User.query.filter_by(id=session["user_id"]).first()

    if not user.ticket_id:
        return abort(404, "No active ticket!")

    ticket = Ticket.query.get(user.ticket_id)

    ticket.active = True
    ticket.claimant = None
    ticket.claimant_name = None
    ticket.claimant_id = None
    db.session.commit()

    return {"message": "Ticket unclaimed!"}


@ticket.route("/awaiting_feedback", methods=["GET"])
@auth_required_decorator(roles=["mentor", "hacker", "admin"])
def awaiting_feedback():
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
    user = User.query.filter_by(id=session["user_id"]).first()

    resolved_tickets = Ticket.query.filter_by(
        creator_id=user.id, status="awaiting_feedback"
    ).all()

    resolved_tickets_data = [ticket.map() for ticket in resolved_tickets]

    return resolved_tickets_data


@ticket.route("/rate", methods=["POST"])
@auth_required_decorator(roles=["hacker", "admin"])
def rate():
    data = request.get_json()
    # mentor = User.query.get(int(data["mentor_id"]))
    mentor = User.query.get(data["mentor_id"])
    mentor.ratings.append(data["rating"])
    if len(data['review']) != 0:
        mentor.reviews.append(data['review'])
    db.session.commit()

    ticket = Ticket.query.get(int(data["id"]))
    ticket.status = "completed"
    db.session.delete(ticket)
    ticket.active = False

    db.session.commit()

    return mentor.ratings


@ticket.route("/resolve", methods=["POST"])
@auth_required_decorator(roles=["hacker", "admin"])
def resolve():
    # email = session["user"]["userinfo"]["email"]
    # user = User.query.filter_by(email=email).first()
    user = User.query.filter_by(id=session["user_id"]).first()

    if not user.ticket_id:
        return abort(404, "No active ticket!")

    ticket = Ticket.query.get(user.ticket_id)
    ticket.status = "awaiting_feedback"

    data = request.get_json()
    # mentor = User.query.get(int(data["mentor_id"]))
    mentor = User.query.get(data["mentor_id"])
    mentor.resolved_tickets = mentor.resolved_tickets + 1
    mentor.claimed = None
    db.session.commit()

    return {"message": "Ticket resolved! Please rate your mentor."}
