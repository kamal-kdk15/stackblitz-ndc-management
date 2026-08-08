from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import get_connection

router = APIRouter()

class NDCRequest(BaseModel):
    product: str
    strength: str
    dosage: str
    rxOtc: str
    anda: str
    distributor: Optional[str] = None
    packs: int
    createdBy: str
    role: str

@router.post("/generate")
def generate_ndc(req: NDCRequest):
    if req.role == "Viewer":
        return {"success": False, "message": "Access Denied"}
    
    conn = get_connection()
    cur = conn.cursor()
    
    # Product code counter
    cur.execute("SELECT COUNT(DISTINCT SPLIT_PART(ndc_code, '-', 2)) FROM ndc_registry")
    count = cur.fetchone()[0]
    product_code = str(count + 1).zfill(3)
    labeler = "70095"
    generated = []
    
    for i in range(1, req.packs + 1):
        pkg_code = str(i).zfill(2)
        ndc = f"{labeler}-{product_code}-{pkg_code}"
        
        # Duplicate check
        cur.execute("SELECT id FROM ndc_registry WHERE ndc_code=%s", (ndc,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {"success": False, "message": f"Duplicate NDC: {ndc}"}
        
        cur.execute("""
            INSERT INTO ndc_registry 
            (ndc_code, product_name, strength, dosage_form, 
             rx_otc, anda_number, distributor, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (ndc, req.product, req.strength, req.dosage,
              req.rxOtc, req.anda, req.distributor or "-", req.createdBy))
        
        generated.append(ndc)
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        "success": True,
        "message": "NDC Generated Successfully",
        "ndcCodes": generated
    }

@router.get("/registry")
def get_registry():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, ndc_code, product_name, strength, 
               dosage_form, rx_otc, anda_number, 
               distributor, status, created_by, created_at 
        FROM ndc_registry 
        ORDER BY created_at DESC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    data = []
    for r in rows:
        data.append({
            "id": r[0],
            "ndc_code": r[1],
            "product_name": r[2],
            "strength": r[3],
            "dosage_form": r[4],
            "rx_otc": r[5],
            "anda_number": r[6],
            "distributor": r[7],
            "status": r[8],
            "created_by": r[9],
            "created_at": str(r[10])
        })
    
    return {"success": True, "data": data}