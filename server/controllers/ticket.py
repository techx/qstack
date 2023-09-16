from flask import current_app as app, url_for, redirect, session, request
from server import db
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from os import environ as env
from urllib.parse import quote_plus, urlencode
import csv
from server.models import User, Ticket

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
def save():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    data = request.get_json()

    if not user.ticket_id:
        ticket = Ticket(user, data, False)
        db.session.add(ticket)
        db.session.commit()
        user.ticket_id = ticket.id
    else:
        ticket = Ticket.query.get(user.ticket_id)
        ticket.update(data)

    db.session.commit()

    return {"message": "Ticket has been updated."}

@ticket.route("/submit", methods=["POST"])
def submit():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    if len(user.name) == 0:
        return abort(404, "Update name in profile page before submitting!")

    if user.ticket_id:
        ticket = Ticket.query.get(user.ticket_id)
        if ticket.active:
            return abort(404, "User already has an active ticket!")

    data = request.get_json()

    ticket = Ticket(user, data, True)
    db.session.add(ticket)
    db.session.commit()

    user.ticket_id = ticket.id
    db.session.commit()

    return {"message": "Ticket has been created."}


@ticket.route("/get")
def get():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()


    if not user.ticket_id:
        return {"active": False}
    
    ticket = Ticket.query.get(user.ticket_id)
    if not ticket.active:
        return {"active": False, "ticket": ticket.map()}

    ticket = Ticket.query.get(user.ticket_id)
    return {"active": True, "ticket": ticket.map()}

@ticket.route("/remove", methods=["POST"])
def remove():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    if not user.ticket_id:
        return abort(404, "No active ticket!")

    ticket = Ticket.query.get(user.ticket_id)


    delete = bool(request.get_json()["del"])
    if delete:
        db.session.delete(ticket)

    ticket.active = False
    db.session.commit()
    return {"message": "Ticket removed from queue!"}

@ticket.route("/status")
def status():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    if not user.ticket_id:
        return {"status": "unclaimed", "message": "No ticket!"}
    
    ticket = Ticket.query.get(user.ticket_id)
    if not ticket.claimant_id:
        return {"status": "unclaimed", "message": "Ticket not claimed!"}

    mentor = User.query.get(ticket.claimant_id)
    return {"status": "claimed", "mentorData": mentor.map()}

@ticket.route("/unclaim")
def unclaim():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    if not user.ticket_id:
        return abort(404, "No active ticket!")

    ticket = Ticket.query.get(user.ticket_id)

    ticket.claimant = None
    ticket.claimant_id = None
    db.session.commit()

    return {"message": "Ticket unclaimed!"}