from fastapi import APIRouter
from pydantic import BaseModel
from database import get_connection

router = APIRouter()

class ChangeRequest(BaseModel):
    originalNdc: str
    changeType: str
    reason: str
    requestedBy: str

@router.post("/request")
def request_change(req: ChangeRequest):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM ndc_registry WHERE ndc_code=%s", (req.originalNdc,))
    if not cur.fetchone():
        return {"success": False, "message": "NDC not found"}
    
    impact = ""
    if req.changeType == "pack":
        impact = "New Package Code only — Product Code unchanged"
    elif req.changeType == "strength":
        impact = "New Product Code required — full NDC reassignment"
    elif req.changeType == "name":
        impact = "New Product Code required — ANDA amendment may be needed"
    
    cur.execute("""
        INSERT INTO change_requests 
        (original_ndc, change_type, reason, impact, requested_by)
        VALUES (%s, %s, %s, %s, %s)
    """, (req.originalNdc, req.changeType, req.reason, impact, req.requestedBy))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {"success": True, "message": "Change request submitted", "impact": impact}

@router.get("/")
def get_changes():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM change_requests ORDER BY created_at DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    data = []
    for r in rows:
        data.append({
            "id": r[0],
            "originalNdc": r[1],
            "changeType": r[2],
            "reason": r[3],
            "impact": r[4],
            "status": r[5],
            "requestedBy": r[6],
            "reviewedBy": r[7],
            "created_at": str(r[8])
        })
    
    return {"success": True, "data": data}