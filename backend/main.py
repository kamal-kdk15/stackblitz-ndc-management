from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, ndc, changes, audit

app = FastAPI(title="NDC Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(ndc.router, prefix="/api/ndc")
app.include_router(changes.router, prefix="/api/changes")
app.include_router(audit.router, prefix="/api/audit")

@app.get("/")
def root():
    return {"message": "NDC Management API Running"}