from flask import current_app as app, url_for, redirect, session, request
from server import db
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from os import environ as env
from urllib.parse import quote_plus, urlencode
import csv
from server.controllers.auth import auth_required_decorator
from server.models import User, Ticket

admin = APIBlueprint("admin", __name__, url_prefix="/admin")

@admin.route("/ticketdata")
@auth_required_decorator(roles=["mentor"])
def getTicketData():
    mentors = User.query.filter_by(role="mentor").all()
    totalTickets = 0
    totalRatings = 0
    totalMentors = 0

    for mentor in mentors:
        totalTickets += mentor.resolved_tickets
        if len(mentor.ratings) != 0:
            totalRatings += sum(mentor.ratings) / len(mentor.ratings)
            totalMentors += 1

    if totalMentors != 0:
        averageRating = totalRatings/totalMentors
    else:
        averageRating = 0

    return {"total": totalTickets, "averageRating": averageRating  }

@admin.route("/userdata")
@auth_required_decorator(roles=["mentor"])
def getUserData():
    users = User.query.all()
    userData = []

    for user in users:
        userData.append(user.map())

    return userData
