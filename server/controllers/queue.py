from flask import current_app as app, url_for, redirect, session, request
from server import db
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from os import environ as env
from urllib.parse import quote_plus, urlencode
import csv
from server.models import User, Ticket

queue = APIBlueprint("queue", __name__, url_prefix="/queue")


@queue.route("/get")
def get():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if user.role != "mentor":
        return abort(403, "Method not allowed!")

    tickets = []
    for ticket in Ticket.query.all():
        creator = User.query.get(ticket.creator_id)
        tickets.append(dict(ticket.map(), creator=creator.name))
    return tickets


@queue.route("/claim", methods=["POST"])
def claim():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if user.role != "mentor":
        return abort(403, "Method not allowed!")

    data = request.get_json()
    ticket_id = int(data["id"])

    ticket = Ticket.query.get(ticket_id)
    if ticket.claimant_id is not None:
        return abort(400, "Ticket already claimed")

    ticket.claimant = user
    ticket.active = False
    user.claimed = ticket

    db.session.commit()
    return {"message": "Ticket claimed!"}


@queue.route("/unclaim", methods=["POST"])
def unclaim():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if user.role != "mentor":
        return abort(403, "Method not allowed!")

    data = request.get_json()
    ticket_id = int(data["id"])

    ticket = Ticket.query.get(ticket_id)
    if ticket.claimant_id is None:
        return abort(400, "Ticket is not claimed")

    ticket.active = True
    ticket.claimant = None
    ticket.claimant_id = None
    user.claimed = None

    db.session.commit()
    return {"message": "Ticket unclaimed!"}


@queue.route("/resolve", methods=["POST"])
def resolve():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if user.role != "mentor":
        return abort(403, "Method not allowed!")

    data = request.get_json()
    ticket_id = int(data["id"])

    ticket = Ticket.query.get(ticket_id)
    db.session.delete(ticket)

    user.claimed = None
    db.session.commit()

    return {"message": "Ticket resolved!"}


@queue.route("/claimed")
def claimed():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()
    if user.role != "mentor":
        return abort(403, "Method not allowed!")

    tickets = []
    for ticket in Ticket.query.filter(Ticket.claimant_id != None).all():
        if ticket.claimant_id == user.id:
            return {"claimed": ticket.id}

    return {"claimed": None}
