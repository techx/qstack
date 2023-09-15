from flask import current_app as app, url_for, redirect, session, request
from server import db
from authlib.integrations.flask_client import OAuth
from apiflask import APIBlueprint, abort
from os import environ as env
from urllib.parse import quote_plus, urlencode
import csv

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
