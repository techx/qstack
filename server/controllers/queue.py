from flask import current_app as app, url_for, redirect, session, request
from server import db
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from os import environ as env
from urllib.parse import quote_plus, urlencode
import csv
from server.models import User, Ticket
from server.controllers.auth import auth_required_decorator
from flask import jsonify

queue = APIBlueprint("queue", __name__, url_prefix="/queue")


@queue.route("/get")
@auth_required_decorator(roles=["mentor"])
def get():
    tickets = []
    for ticket in Ticket.query.all():
        creator = User.query.get(ticket.creator_id)
        if ticket.status != "awaiting_feedback":
            tickets.append(dict(ticket.map(), creator=creator.name))
    return tickets


@queue.route("/claim", methods=["POST"])
@auth_required_decorator(roles=["mentor"])
def claim():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    data = request.get_json()
    ticket_id = int(data["id"])

    ticket = Ticket.query.get(ticket_id)
    if ticket.claimant_id is not None:
        return abort(400, "Ticket already claimed")
    
    ticket.status = "claimed"
    ticket.claimant = user
    ticket.active = False
    user.claimed = ticket

    db.session.commit()
    return {"message": "Ticket claimed!"}


@queue.route("/unclaim", methods=["POST"])
@auth_required_decorator(roles=["mentor"])
def unclaim():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    data = request.get_json()
    ticket_id = int(data["id"])

    ticket = Ticket.query.get(ticket_id)
    if ticket.claimant_id is None:
        return abort(400, "Ticket is not claimed")

    ticket.active = True
    ticket.claimant = None
    ticket.claimant_id = None
    ticket.status = None
    user.claimed = None

    db.session.commit()
    return {"message": "Ticket unclaimed!"}


@queue.route("/resolve", methods=["POST"])
@auth_required_decorator(roles=["mentor"])
def resolve():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    data = request.get_json()
    ticket_id = int(data["id"])
    ticket = Ticket.query.get(ticket_id)
    ticket.status = "awaiting_feedback"

    user.resolved_tickets = user.resolved_tickets + 1

    user.claimed = None
    db.session.commit()

    return {"message": "Ticket resolved! Awaiting user feedback"}


@queue.route("/claimed")
@auth_required_decorator(roles=["mentor"])
def claimed():
    email = session["user"]["userinfo"]["email"]
    user = User.query.filter_by(email=email).first()

    for ticket in Ticket.query.filter(Ticket.claimant_id != None).all():
        if ticket.claimant_id == user.id and ticket.status == "claimed":
            return {"claimed": ticket.id}

    return {"claimed": None}

@queue.route("/ranking", methods=["GET"])
@auth_required_decorator(roles=["mentor"])
def ranking():
    mentors = User.query.filter_by(role="mentor")
    ranking = []
    for mentor in mentors:
        if len(mentor.ratings) > 0:
            mentor_rating = sum(mentor.ratings)/len(mentor.ratings)
            ranking.append((mentor.resolved_tickets, mentor.name, mentor_rating))
        else:
            ranking.append((mentor.resolved_tickets, mentor.name, 0))

    ranking = sorted(ranking, key=lambda x: (x[0], x[2]), reverse=True)

    rankings = []
    val = 1
    for rank in ranking:
        status = {
            "rank": val,
            "tickets": rank[0],
            "name": rank[1],
            "ratings": rank[2]
        }
        val += 1
        rankings.append(status)

    return rankings