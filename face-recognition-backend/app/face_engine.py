from insightface.app import FaceAnalysis
import cv2
import numpy as np

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0)

def get_embedding(image_path):
    image = cv2.imread(image_path)

    faces = app.get(image)

    if len(faces) == 0:
        return None

    embedding = faces[0].embedding

    return embedding
