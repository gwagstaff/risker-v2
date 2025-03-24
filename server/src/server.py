import asyncio
import logging
from src.network.server import GameServer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    server = GameServer()
    try:
        await server.start()
    except KeyboardInterrupt:
        logger.info("Server shutting down...")

if __name__ == "__main__":
    asyncio.run(main()) 