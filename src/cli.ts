import { answer } from "./answer.js";
import { openStore } from "./store.js";

const question = process.argv.slice(2).join(" ");
if (!question) {
  console.error('Usage: npm run ask -- "how does Krish reach atlas?"');
  process.exitCode = 1;
} else {
  const store = await openStore();
  try {
    console.log((await answer(store, question)).text);
  } finally {
    await store.close();
  }
}
