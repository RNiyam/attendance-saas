export async function getFaceEmbedding(imageSrcBase64: string): Promise<number[] | null> {
  const res = await fetch(imageSrcBase64);
  const blob = await res.blob();
  
  const formData = new FormData();
  formData.append("file", blob, "face.jpg");

  try {
    const response = await fetch("http://localhost:8000/extract-face", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      return data.embedding;
    }
    return null;
  } catch (error) {
    console.error("Failed to extract face", error);
    return null;
  }
}
