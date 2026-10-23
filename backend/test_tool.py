
import asyncio
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async def main():
    async with streamablehttp_client("http://127.0.0.1:8001/mcp") as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "add_task",
                {
                    "title": "Test MCP task creation",
                    "subject": "Testing",
                    "due": "Tomorrow",
                    "minutes": 15,
                    "priority": "High"
                }
            )

            print("ADD TASK RESULT:")
            for item in result.content:
                if hasattr(item, "text"):
                    print(item.text)

asyncio.run(main())

