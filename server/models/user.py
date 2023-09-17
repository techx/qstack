from server import db
from sqlalchemy import Column, Integer, Boolean, Text, String, ForeignKey
from sqlalchemy.orm import relationship


class User(db.Model):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    role = Column(Text, nullable=False)
    location = Column(Text, nullable=False)
    zoomlink = Column(Text, nullable=False)

    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="SET NULL"))
    ticket = relationship("Ticket", foreign_keys=[ticket_id])

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if self.name is None:
            self.name = ""
        self.role = "hacker"
        self.location = "in person"
        self.zoomlink = ""

    def map(self):
        return {
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "location": self.location,
            "zoomlink": self.zoomlink,
        }
