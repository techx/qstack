from server import db
from sqlalchemy import Column, Integer, Boolean, Text, String, ForeignKey, ARRAY, DateTime
from sqlalchemy.orm import relationship

from server.plume.utils import get_info


class Ticket(db.Model):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, nullable=False)
    creator_id = Column(String, ForeignKey("users.id"))
    creator = relationship("User", foreign_keys=[creator_id])

    claimant_id = Column(String, ForeignKey("users.id"))
    claimant = relationship("User", foreign_keys=[claimant_id])

    question = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    location = Column(Text, nullable=False)
    tags = Column(ARRAY(Text), nullable=False)
    images = Column(ARRAY(Text), nullable=False)

    active = Column(Boolean, nullable=False, default=True)
    status = Column(String)

    createdAt = Column(DateTime, nullable=False)
    claimedAt = Column(DateTime)

    def __init__(self, user, data, active):
        self.creator = user
        self.question = data["question"]
        self.content = data["content"]
        self.location = data["location"]
        self.tags = data["tags"]
        self.images = data.get("images", [])
        self.active = active
        self.createdAt = db.func.now()
        self.status = "unclaimed"
        self.claimedAt = None

    def update(self, data):
        self.question = data["question"]
        self.content = data["content"]
        self.location = data["location"]
        self.images = data.get("images", [])
        self.tags = data["tags"]

    def map(self):
        info = get_info([str(self.creator_id), str(self.claimant_id)])
        
        return {
            "id": self.id,
            "question": self.question,
            "active": self.active,
            "content": self.content,
            "tags": self.tags,
            "location": self.location,
            "images": self.images,
            "creator": info[str(self.creator_id)]["name"],
            "discord": self.creator.discord,
            "createdAt": self.createdAt,
            "status": self.status,
            "mentor_name": info[str(self.claimant_id)]["name"] if self.claimant else None,
            "mentor_id": self.claimant_id
        }
