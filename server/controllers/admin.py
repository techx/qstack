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
@auth_required_decorator(roles=["admin"])
def getTicketData():
    mentors = User.query.filter_by(role="mentor").all()
    totalTickets = 0
    sumAverageMentorRating = 0
    totalMentors = 0
    avgTime = 0
    totalTickets = 0

    for mentor in mentors:
        totalTickets += len(mentor.ratings)
        if len(mentor.ratings) != 0:
            sumAverageMentorRating += sum(mentor.ratings) / len(mentor.ratings)
            totalMentors += 1
    
    for mentor in mentors:
        totalTickets += len(mentor.ratings)
        if len(mentor.ratings) != 0:
            sumAverageMentorRating += sum(mentor.ratings) / len(mentor.ratings)
            totalMentors += 1
    
    # for ticket in Ticket.query.all():
    #     if ticket.claimedAt is not None:
    #         avgTime += (ticket.claimedAt - ticket.createdAt).total_seconds()
    #         totalTickets += 1
    for ticket in Ticket.query.filter(Ticket.claimedAt.isnot(None)).all():
        avgTime += (ticket.claimedAt - ticket.createdAt).total_seconds()
        totalTickets += 1

    if totalMentors != 0:
        averageRating = sumAverageMentorRating/totalMentors
    else:
        averageRating = 0
    
    if totalTickets != 0:
        avgTimeToClaim = avgTime/totalTickets
    else:
        avgTimeToClaim = 0

    return {"total": totalTickets, "averageRating": averageRating, "averageTime": avgTimeToClaim}


@admin.route("/userdata")
@auth_required_decorator(roles=["admin"])
def getUserData():
    users = User.query.all()
    userData = []

    for user in users:
        userData.append(user.map())

    return userData
