import os
import httpx
import logging

log = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip("'").strip('"')
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

async def get_ai_coach_response(user_message: str, history: list = None, user_context: str = None):
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        return "AI Coach is currently offline. Please add your GROQ_API_KEY to the .env file."

    if not user_message or not user_message.strip():
        return "Please ask a question!"

    system_content = "You are the AuraFit AI Coach, a world-class fitness and nutrition expert. Your goal is to provide scientific, encouraging, and highly professional gym-related advice. Keep responses concise and focused on fitness."
    if user_context:
        system_content += f"\n\nCONTEXT ON THE CURRENT USER:\n{user_context}\nUse this data to provide personalized advice."

    messages = [
        {"role": "system", "content": system_content}
    ]
    
    if history:
        messages.extend(history)
    
    messages.append({"role": "user", "content": user_message})

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        error_detail = "Unknown error"
        try:
            error_json = e.response.json()
            error_detail = error_json.get("error", {}).get("message", e.response.text)
        except:
            error_detail = e.response.text
            
        log.error(f"GROQ API Status Error: {e.response.status_code} - {error_detail}")
        return f"AI Coach Error ({e.response.status_code}): {error_detail}"
    except Exception as e:
        log.error(f"Error calling GROQ API: {e}")
        return f"Connection Error: {str(e)}. Make sure 'httpx' is installed and your internet is active."
