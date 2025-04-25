from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from writer_agents.style_inspector import StyleGuard

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/style-guard")
async def style_guard(request: Request):
    data = await request.json()
    style_prompt = data.get("style_prompt", "")
    text = data.get("text", "")
    
    if not text:
        return {"error": "No text provided"}
    
    style_guard = StyleGuard(style_prompt=style_prompt)
    result = style_guard.inspect_style(text)
    
    return {"result": result}

@app.websocket("/api/style-guard")
async def websocket_style_guard(websocket: WebSocket):
    async def send_comment(original_text, text_with_comments):
        await websocket.send_json({"original_text": original_text, "text_with_comments": text_with_comments})
        return text_with_comments
    
    await websocket.accept()
    
    # Receive style prompt once at connection establishment
    initial_data = await websocket.receive_json()
    style_prompt = initial_data.get("style_prompt", "")
    
    # Create StyleGuard instance
    style_guard = StyleGuard(
        style_prompt=style_prompt, 
        callback=send_comment
    )
    
    try:
        while True:
            # Receive next message
            data = await websocket.receive_json()
            
            # Check if style_prompt is provided in this message
            if "style_prompt" in data:
                # Update style prompt and recreate StyleGuard instance
                style_prompt = data.get("style_prompt", "")
                style_guard = StyleGuard(
                    style_prompt=style_prompt,
                    callback=send_comment
                )
            
            # Get text for checking
            text = data.get("text", "")
            
            if not text:
                await websocket.send_json({"error": "No text provided"})
                continue
                
            # Process the text
            result = style_guard.inspect_style(text)
            
            # Send back the result if not already sent by the callback
            if result:
                await websocket.send_json({"result": result})
                
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 