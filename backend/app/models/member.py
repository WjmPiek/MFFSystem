from datetime import datetime

from ..extensions import db


class MemberRecord(db.Model):
    __tablename__ = 'member_records'

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    member_number = db.Column(db.String(120), nullable=True, index=True)
    first_name = db.Column(db.String(120), nullable=True)
    last_name = db.Column(db.String(120), nullable=True)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=True, index=True)
    phone = db.Column(db.String(80), nullable=True)
    join_date = db.Column(db.String(40), nullable=True)
    status = db.Column(db.String(80), nullable=True)
    organisation_name = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    source_filename = db.Column(db.String(255), nullable=True)
    imported_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'member_number': self.member_number,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'join_date': self.join_date,
            'status': self.status,
            'organisation_name': self.organisation_name,
            'notes': self.notes,
            'source_filename': self.source_filename,
            'imported_at': self.imported_at.isoformat() if self.imported_at else None,
        }
