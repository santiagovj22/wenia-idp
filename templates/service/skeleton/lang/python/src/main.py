"""${{ values.serviceName }} — Python thin skeleton (maturity: thin)."""
from fastapi import FastAPI

app = FastAPI(title="${{ values.serviceName }}")


@app.get("/health")
def health():
    return {"status": "ok"}
