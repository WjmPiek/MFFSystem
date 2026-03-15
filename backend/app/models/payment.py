from datetime import datetime

from ..extensions import db


class PaymentTransaction(db.Model):
    __tablename__ = 'payment_transactions'

    id = db.Column(db.Integer, primary_key=True)
    payer_name = db.Column(db.String(255), nullable=False)
    reference = db.Column(db.String(120), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    franchise_name = db.Column(db.String(255), nullable=True)
    statement_filename = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='unmatched')
    allocated_to = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'payer_name': self.payer_name,
            'reference': self.reference,
            'amount': self.amount,
            'franchise_name': self.franchise_name,
            'statement_filename': self.statement_filename,
            'status': self.status,
            'allocated_to': self.allocated_to,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
