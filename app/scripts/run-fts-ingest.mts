import { ingestFtsFunding } from "../lib/ingestion/fts-funding";

async function main() {
  const result = await ingestFtsFunding({ year: 2025 });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

void main();
