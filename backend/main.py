from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

@app.get("/")
def root():
    return {"status": "ChatNote backend chal raha hai!"}

@app.post("/chat")
async def chat(request: ChatRequest):
    # Last 10 messages lo — token bachane ke liye
    limited = request.messages[-10:]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant. Respond in the same language the user uses."
            },
            *[m.dict() for m in limited]
        ],
        max_tokens=500,
    )

    reply = response.choices[0].message.content

    return {
        "reply": reply,
        "tokens_used": response.usage.total_tokens
    }
