import { answer } from "./answer.js";
import { openStore } from "./store.js";

const question = process.argv.slice(2).join(" ");
if (!question) {
  console.error('Usage: npm run ask -- "how does Krish reach atlas?"');
  process.exit(1);
}
const store = await openStore();
console.log((await answer(store, question)).text);
process.exit(0);
