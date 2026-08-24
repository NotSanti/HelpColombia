import { config } from "dotenv";
import { resolve } from "node:path";
import { ingestIfrcOperations } from "../lib/ingestion/ifrc-operations";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const result = await ingestIfrcOperations({
    eventId: process.env.IFRC_EVENT_ID || undefined,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

void main();
