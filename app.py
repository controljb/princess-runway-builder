from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

connected_world_clients: list[WebSocket] = []

@app.get("/")
async def root():
    return HTMLResponse("""
    <h1>Princess Runway Builder v3</h1>
    <ul>
      <li><a href="/static/draw.html">Draw Page</a></li>
      <li><a href="/static/world.html">World Page</a></li>
    </ul>
    """)

@app.websocket("/ws/world")
async def websocket_world(websocket: WebSocket):
    await websocket.accept()
    connected_world_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_world_clients:
            connected_world_clients.remove(websocket)

@app.post("/save-design")
async def save_design(payload: dict):
    message = {
        "type": "new_design",
        "dressType": payload.get("dressType", "ballgown"),
        "label": payload.get("label", "Custom Look"),
        "design": payload.get("design", "")
    }
    disconnected = []
    for client in connected_world_clients:
        try:
            await client.send_json(message)
        except Exception:
            disconnected.append(client)
    for client in disconnected:
        if client in connected_world_clients:
            connected_world_clients.remove(client)
    return {"status": "ok"}
