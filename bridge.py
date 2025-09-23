import asyncio, serial, pynmea2, json
from websockets import serve

SERIAL_PORT = '/dev/ttyUSB0'  # vagy 'COM3' Windows alatt, vagy Bluetooth RFCOMM port
BAUD = 9600

clients = set()

async def ws_handler(ws, path):
    clients.add(ws)
    try:
        await ws.wait_closed()
    finally:
        clients.remove(ws)

async def read_serial_and_broadcast():
    ser = serial.Serial(SERIAL_PORT, BAUD, timeout=1)
    while True:
        line = ser.readline().decode('ascii', errors='ignore').strip()
        if not line: 
            await asyncio.sleep(0.1); continue
        try:
            msg = pynmea2.parse(line)
            if hasattr(msg, 'latitude') and msg.latitude != 0:
                lat = msg.latitude
                lon = msg.longitude
                payload = json.dumps({'lat': lat, 'lon': lon, 'time': msg.timestamp.isoformat() if hasattr(msg,'timestamp') else None})
                # küldés mindenkinek
                to_remove = []
                for c in clients:
                    try:
                        await c.send(payload)
                    except:
                        to_remove.append(c)
                for r in to_remove:
                    clients.remove(r)
        except Exception as e:
            # nem NMEA sor, skip
            pass
        await asyncio.sleep(0.01)

async def main():
    ws_server = await serve(ws_handler, '0.0.0.0', 8765)
    await read_serial_and_broadcast()

if __name__ == '__main__':
    asyncio.run(main())
