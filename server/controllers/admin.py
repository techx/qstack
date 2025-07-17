# from concurrent.futures import thread
from flask import current_app as app, url_for, redirect, session, request
from server import db
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from os import environ as env
from urllib.parse import quote_plus, urlencode
import csv
from server.controllers.auth import auth_required_decorator
from server.models import User, Ticket
from server.plume.utils import get_info
import multiprocessing

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
    
    for ticket in Ticket.query.all():
        if ticket.claimedAt is not None:
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

# Admin Stats
@admin.route("/userdata")
@auth_required_decorator(roles=["admin"])
def getUserData():
    users = User.query.all()
    uids = [u.id for u in users]
    
    info = get_info(uids)
    # print("Info fetched")


    # print("Updating info...")
    userData = []
    for user in users:
        userMap = user.map()

        userMap["name"] = info[user.id]["name"] if user.id in info else None
        userMap["email"] = info[user.id]["email"] if user.id in info else None
        userData.append(userMap)

    # print("Maps updated")
    return userData


# def process_user(user, info):
#     """Helper function to process a single user's data"""
#     userMap = user.map()
#     userMap["name"] = info[user.id]["name"] if user.id in info else None
#     userMap["email"] = info[user.id]["email"] if user.id in info else None
#     return userMap


# # Admin Stats
# @admin.route("/userdata")
# @auth_required_decorator(roles=["admin"])
# def getUserData():
#     users = User.query.all()
#     uids = [u.id for u in users]
    
#     info = get_info(uids)
#     print("Info fetched")


#     print("Updating info...")
    
#     # Use ThreadPoolExecutor to parallelize user processing
#     with ThreadPoolExecutor(max_workers=2) as executor:
#         # Create a partial function with the info parameter
#         process_user_with_info = partial(process_user, info=info)
#         # Map the function over all users in parallel
#         userData = list(executor.map(process_user_with_info, users))

#     print("Maps updated")
#     return userData