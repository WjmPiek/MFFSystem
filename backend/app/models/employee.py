from ..extensions import db

class Employee(db.Model):
    __tablename__ = 'employees'

    id = db.Column(db.Integer, primary_key=True)
    franchise_id = db.Column(db.Integer, db.ForeignKey('franchises.id'), nullable=False)
    employee_type = db.Column(db.String(50), nullable=False)
    security_role = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(50))
    full_name = db.Column(db.String(255), nullable=False)
    id_number = db.Column(db.String(50))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    login_username = db.Column(db.String(100))
    login_password_hash = db.Column(db.String(255))
    date_employed = db.Column(db.Date)
    branch = db.Column(db.String(100))
    vendors_id = db.Column(db.String(100))
    pin_code = db.Column(db.String(50))
    status = db.Column(db.String(20), default='Active')
    notes = db.Column(db.Text)
