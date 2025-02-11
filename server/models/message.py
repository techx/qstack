from server import db
from sqlalchemy import Column, Integer, Boolean, Text, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship


class Message(db.Model):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, nullable=False)
    code = Column(Integer, ForeignKey("chatrooms.id"), nullable=False)
    content = Column(Text, nullable=False)

    creator_id = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", foreign_keys=[creator_id])
    claimant_id = Column(Integer, ForeignKey("users.id"))
    claimant = relationship("User", foreign_keys=[claimant_id])

    timestamp = Column(DateTime)

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
            "content": self.content,
            "creator": self.creator_id,
            "status": self.status,
            "mentor_name": self.claimant.name if self.claimant else None,
            "mentor_id": self.claimant_id,
            "timestamp": self.timestamp
        }