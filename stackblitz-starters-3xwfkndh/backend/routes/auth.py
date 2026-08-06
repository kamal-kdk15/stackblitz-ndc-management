from fastapi import APIRouter
from pydantic import BaseModel
from database import get_connection

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(req: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "SELECT id, name, role, is_active FROM users WHERE email=%s AND password=%s",
        (req.email, req.password)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        return {"success": False, "message": "Invalid email or password"}
    
    if not user[3]:
        return {"success": False, "message": "Account is deactivated"}
    
    # Audit log
    log_audit("LOGIN", user[1], "-", "-", "-")
    
    return {
        "success": True,
        "message": f"Welcome {user[1]}!",
        "user": {"id": user[0], "name": user[1], "role": user[2]}
    }

def log_audit(action, performed_by, record_id, old_val, new_val):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO audit_log 
           (action, performed_by, record_id, old_value, new_value)
           VALUES (%s, %s, %s, %s, %s)""",
        (action, performed_by, record_id, old_val, new_val)
    )
    conn.commit()
    cur.close()
    conn.close()