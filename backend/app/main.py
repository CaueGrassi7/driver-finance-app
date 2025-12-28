from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Driver Finance App", description="Driver Finance App")

@app.get("/")
def read_root():
    return {"message": "Backend is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
