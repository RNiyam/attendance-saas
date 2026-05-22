from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import uuid
import numpy as np
import os
from app.face_engine import get_embedding

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("faces", exist_ok=True)
app.mount("/faces", StaticFiles(directory="faces"), name="faces")

@app.post("/extract-face")
async def extract_face(file: UploadFile = File(...)):
    face_id = str(uuid.uuid4())
    filename = f"faces/{face_id}.jpg"

    with open(filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    embedding = get_embedding(filename)

    if embedding is None:
        if os.path.exists(filename):
            os.remove(filename)
        return {
            "success": False,
            "message": "No face detected"
        }

    return {
        "success": True,
        "embedding": embedding.tolist(),
        "imageUrl": f"http://127.0.0.1:8000/faces/{face_id}.jpg"
    }
