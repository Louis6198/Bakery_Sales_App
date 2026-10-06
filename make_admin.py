from database import SessionLocal
from models import User

db = SessionLocal()

try:
    user = db.query(User).filter(
        User.email == "admin@camhuebakery.com"
    ).first()

    if user is None:
        print("User not found")
    else:
        user.role = "admin"
        db.commit()
        print("Admin created successfully")
finally:
    db.close()