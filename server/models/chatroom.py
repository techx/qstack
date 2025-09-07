from server import db
from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    Text,
    String,
    ForeignKey,
    ARRAY,
    DateTime,
)
from sqlalchemy.orm import relationship


class Chatroom(db.Model):
    __tablename__ = "chatrooms"

    id = Column(Integer, primary_key=True, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", foreign_keys=[creator_id])

    claimant_id = Column(Integer, ForeignKey("users.id"))
    claimant = relationship("User", foreign_keys=[claimant_id])

    code = Column(String)

    active = Column(Boolean, nullable=False, default=True)
    status = Column(String)

    def __init__(self, user, data, active):
        self.creator = user
        self.code = data["code"]
        self.active = active
        self.status = "unclaimed"

    def update(self, data):
        self.code = data["code"]

    def map(self):
        return {
            "id": self.id,
            "active": self.active,
            "code": self.code,
            "creator": self.creator_id,
            "status": self.status,
            "mentor_name": self.claimant.name if self.claimant else None,
            "mentor_id": self.claimant_id,
        }
