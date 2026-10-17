// ============================================================
//  Run this file with:  node examples.js
//  Each section is separated — read the output carefully!
// ============================================================


// ─── PART 1: SYNCHRONOUS (blocking) ──────────────────────────
console.log("\n=== PART 1: Synchronous ===");

console.log("A: Start");

// Everything here runs line-by-line, in order, RIGHT NOW.
// The loop BLOCKS the thread — nothing else runs during it.
let count = 0;
for (let i = 0; i < 500_000_000; i++) count++;

console.log("B: Loop done (you had to WAIT for me)");
console.log("C: End");

// Output order: A → B → C
// Lesson: sync code is predictable but can freeze your app.


// ─── PART 2: ASYNCHRONOUS (non-blocking) ─────────────────────
console.log("\n=== PART 2: Asynchronous — setTimeout ===");

console.log("A: Start");

// setTimeout hands the callback to the Web API / Node timer.
// The call stack is FREE immediately — it doesn't wait.
setTimeout(() => {
  console.log("C: I ran after the stack was empty!");
}, 0);  // ← 0ms delay still runs AFTER synchronous code!

console.log("B: End");

// Output order: A → B → C
// Lesson: even 0ms timeout runs AFTER all synchronous code.


// ─── PART 3: PROMISES (Microtasks) ───────────────────────────
console.log("\n=== PART 3: Promises (Microtask Queue) ===");

console.log("A: Start");

// Promise.then callbacks go into the MICROTASK queue.
// Microtasks run BEFORE any setTimeout (macrotask).
Promise.resolve()
  .then(() => console.log("C: Promise resolved (microtask)"));

setTimeout(() => {
  console.log("D: setTimeout fired (macrotask)");
}, 0);

console.log("B: End");

// Output order: A → B → C → D
// Lesson: Promises beat setTimeout, even at 0ms!


// ─── PART 4: THE MIND-BENDER (all three together) ────────────
console.log("\n=== PART 4: Mixed — predict the output! ===");

console.log("1");                                // sync

setTimeout(() => console.log("2"), 0);          // macrotask

Promise.resolve().then(() => console.log("3")); // microtask

Promise.resolve()                               // microtask (chained)
  .then(() => console.log("4"));

console.log("5");                               // sync

// Think about it before scrolling...
//
//
//
//
//
//
// Answer: 1 → 5 → 3 → 4 → 2
//
// Why?
//   Sync first:       1, 5
//   Microtasks next:  3, 4   (all microtasks drain before any macrotask)
//   Macrotask last:   2


// ─── PART 5: ASYNC / AWAIT (syntactic sugar for Promises) ────
console.log("\n=== PART 5: async/await ===");

// async/await is just a cleaner way to write .then() chains.
// Under the hood it's still Promises and the microtask queue.

async function fetchData() {
  console.log("B: inside fetchData (before await)");

  // 'await' pauses THIS function and returns control to the caller.
  // The rest of fetchData is scheduled as a microtask.
  const result = await Promise.resolve("mock data");

  console.log("D: inside fetchData (after await) →", result);
}

console.log("A: before calling fetchData");
fetchData();
console.log("C: after calling fetchData (sync code continues!)");

// Output order: A → B → C → D
// Lesson: code after 'await' is a microtask — the caller keeps running first.


// ─── SUMMARY TABLE ───────────────────────────────────────────
console.log(`
=== SUMMARY ===

Code type          | Where it goes       | When it runs
─────────────────────────────────────────────────────────────
Sync code          | Call Stack          | Immediately, in order
setTimeout/setInt  | Web API → Macrotask | After stack empty (last)
Promise.then/catch | Microtask Queue     | After stack empty (before macrotasks)
async/await        | Microtask Queue     | Same as Promise.then

Priority: Call Stack > Microtasks > Macrotasks
`);
