import { ingestSgcSeismic } from "../lib/ingestion/sgc-seismic";

async function main() {
  const result = await ingestSgcSeismic();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

void main();
