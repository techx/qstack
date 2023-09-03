from server import db
from sqlalchemy import Column, Integer, Boolean, Text, String


class User(db.Model):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    role = Column(Text, nullable=False)

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if self.name is None:
            self.name = ""
        self.role = "hacker"

    def map(self):
        return {"name": self.name, "email": self.email, "role": self.role}
