from fastapi import APIRouter
from database import get_connection

router = APIRouter()

@router.get("/")
def get_audit():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT action, performed_by, record_id, 
               old_value, new_value, timestamp 
        FROM audit_log 
        ORDER BY timestamp DESC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    data = []
    for r in rows:
        data.append({
            "action": r[0],
            "performedBy": r[1],
            "recordId": r[2],
            "oldValue": r[3],
            "newValue": r[4],
            "timestamp": str(r[5])
        })
    
    return {"success": True, "data": data}