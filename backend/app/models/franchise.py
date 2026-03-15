from ..extensions import db

class Franchise(db.Model):
    __tablename__ = 'franchises'

    id = db.Column(db.Integer, primary_key=True)
    franchise_name = db.Column(db.String(255), nullable=False)
    ta_name = db.Column(db.String(255))
    franchise_code = db.Column(db.String(50), unique=True, nullable=False)
    owner_name = db.Column(db.String(255))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    office_address = db.Column(db.Text)
