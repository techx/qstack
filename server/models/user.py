from server import db
from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey,
    ARRAY,
    Numeric,
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableList


class User(db.Model):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    role = Column(Text, nullable=False)
    location = Column(Text, nullable=False)
    zoomlink = Column(Text, nullable=False)
    discord = Column(Text, nullable=False)
    resolved_tickets = Column(Integer)
    ratings = Column(MutableList.as_mutable(ARRAY(Numeric(2, 1))))
    reviews = Column(MutableList.as_mutable(ARRAY(Text)), nullable=False)

    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="SET NULL"))
    ticket = relationship("Ticket", foreign_keys=[ticket_id])

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if self.name is None:
            self.name = ""
        self.role = "hacker"
        self.location = "in person"
        self.zoomlink = ""
        self.discord = ""
        self.resolved_tickets = 0
        self.ratings = []
        self.reviews = []

    def map(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "location": self.location,
            "zoomlink": self.zoomlink,
            "discord": self.discord,
            "resolved_tickets": (
                self.resolved_tickets if self.role == "mentor" else "Not Applicable"
            ),
            "ratings": (
                sum(self.ratings) / len(self.ratings)
                if self.role == "mentor" and len(self.ratings) != 0
                else None
            ),
            "reviews": self.reviews if self.reviews != None else [],
        }
