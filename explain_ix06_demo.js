// ==============================================================================
// DBMS PROJECT - EXPLAIN PLAN EXECUTION STATS COMPARISON (IX-06 vs COLLSCAN)
// ==============================================================================
// Database: library_db on replica set rs0
// Collection: book_copies
// Index Target: IX-06 (Compound Index on bookId, status, branch)
// Comparison: Index Scan (IXSCAN) vs Forced Collection Scan ($natural: 1)
// ==============================================================================

const dbName = 'library_db';
const libraryDb = db.getSiblingDB(dbName);

function banner(text) {
  print(`\n======================================================================================================`);
  print(`  ${text}`);
  print(`======================================================================================================`);
}

function section(title) {
  print(`\n------------------------------------------------------------------------------------------------------`);
  print(`  ${title}`);
  print(`------------------------------------------------------------------------------------------------------`);
}

banner("DBMS PROJECT: EXPLAIN PLAN EXECUTION STATS AUDIT (INDEX IX-06 vs COLLSCAN)");
print(`  • Target Database   : ${dbName}`);
print(`  • Target Collection : book_copies`);
print(`  • Evaluation Mode   : explain("executionStats")`);
print(`  • Replica Set Node  : ${rs.status().members.find(m => m.state === 1).name} (PRIMARY)`);

// 1. Select a target book for copy lookup
const targetBook = libraryDb.books.findOne({ title: "Database System Concepts" }) || libraryDb.books.findOne();
const query = {
  bookId: targetBook._id,
  status: "AVAILABLE",
  branch: "Main Campus - Central Library"
};

section("1. TARGET QUERY & INDEX IX-06 SPECIFICATION");
print(`  Target Book: "${targetBook.title}" (ISBN: ${targetBook.isbn})`);
print(`  Book ObjectId: ObjectId("${targetBook._id}")\n`);
print(`  Target Query Filter:`);
print(`    db.book_copies.find({`);
print(`      bookId: ObjectId("${targetBook._id}"),`);
print(`      status: "AVAILABLE",`);
print(`      branch: "Main Campus - Central Library"`);
print(`    })\n`);
print(`  Target Index Designation : IX-06 (Compound Inventory Lookup Index)`);
print(`  Index Key Pattern        : { bookId: 1, status: 1, branch: 1 }`);
print(`  Index Identifier Name    : bookId_1_status_1_branch_1`);

// 2. Execution with Index IX-06 (IXSCAN)
section("2. EXECUTION WITH INDEX IX-06 (IXSCAN)");
const ixExplain = libraryDb.book_copies.find(query).hint("bookId_1_status_1_branch_1").explain("executionStats");

const ixWinningPlan = ixExplain.queryPlanner.winningPlan;
const ixWinningStage = ixWinningPlan.stage;
const ixInputStage = ixWinningPlan.inputStage ? ixWinningPlan.inputStage.stage : "N/A";
const ixIndexName = ixWinningPlan.inputStage ? ixWinningPlan.inputStage.indexName : "N/A";
const ixKeyPattern = ixWinningPlan.inputStage ? JSON.stringify(ixWinningPlan.inputStage.keyPattern) : "N/A";
const ixIndexBounds = ixWinningPlan.inputStage ? ixWinningPlan.inputStage.indexBounds : {};

const ixExecutionStats = ixExplain.executionStats;
const ixNReturned = ixExecutionStats.nReturned;
const ixTotalDocsExamined = ixExecutionStats.totalDocsExamined;
const ixTotalKeysExamined = ixExecutionStats.totalKeysExamined;
const ixExecutionTimeMillis = ixExecutionStats.executionTimeMillis;

print(`  Winning Plan Object (IX-06):`);
print(JSON.stringify({
  stage: ixWinningStage,
  inputStage: {
    stage: ixInputStage,
    indexName: ixIndexName,
    keyPattern: ixWinningPlan.inputStage ? ixWinningPlan.inputStage.keyPattern : null,
    direction: ixWinningPlan.inputStage ? ixWinningPlan.inputStage.direction : null
  }
}, null, 4));

print(`\n  Execution Stats (IX-06):`);
print(`    • winningPlan Stage   : ${ixWinningStage} -> ${ixInputStage} (${ixIndexName})`);
print(`    • nReturned           : ${ixNReturned}`);
print(`    • totalDocsExamined   : ${ixTotalDocsExamined}`);
print(`    • totalKeysExamined   : ${ixTotalKeysExamined}`);
print(`    • executionTimeMillis : ${ixExecutionTimeMillis} ms`);


// 3. Execution with Forced Collection Scan (COLLSCAN via $natural: 1)
section("3. FORCED COLLECTION SCAN ($natural: 1 / COLLSCAN)");
const collExplain = libraryDb.book_copies.find(query).hint({ $natural: 1 }).explain("executionStats");

const collWinningPlan = collExplain.queryPlanner.winningPlan;
const collWinningStage = collWinningPlan.stage;

const collExecutionStats = collExplain.executionStats;
const collNReturned = collExecutionStats.nReturned;
const collTotalDocsExamined = collExecutionStats.totalDocsExamined;
const collTotalKeysExamined = collExecutionStats.totalKeysExamined;
const collExecutionTimeMillis = collExecutionStats.executionTimeMillis;

print(`  Winning Plan Object (Forced COLLSCAN):`);
print(JSON.stringify({
  stage: collWinningStage,
  direction: collWinningPlan.direction,
  filter: collWinningPlan.filter
}, null, 4));

print(`\n  Execution Stats (COLLSCAN):`);
print(`    • winningPlan Stage   : ${collWinningStage}`);
print(`    • nReturned           : ${collNReturned}`);
print(`    • totalDocsExamined   : ${collTotalDocsExamined} (Scanned every document in collection!)`);
print(`    • totalKeysExamined   : ${collTotalKeysExamined}`);
print(`    • executionTimeMillis : ${collExecutionTimeMillis} ms`);


// 4. Summarized Comparison Matrix
banner("SECTION 4: SUMMARIZED EXPLAIN COMPARISON MATRIX");

print(`+--------------------------+------------------------------------+------------------------------------+`);
print(`| Performance Metric       | Index Scan (IX-06 IXSCAN)          | Forced Collection Scan (COLLSCAN)  |`);
print(`+--------------------------+------------------------------------+------------------------------------+`);
print(`| winningPlan.stage        | ${String(ixWinningStage).padEnd(34)} | ${String(collWinningStage).padEnd(34)} |`);
print(`| winningPlan.inputStage   | ${String(ixInputStage + " (" + ixIndexName + ")").padEnd(34)} | ${"None (Full table scan)".padEnd(34)} |`);
print(`| Key Pattern              | ${String(ixKeyPattern).padEnd(34)} | ${"None ($natural: 1)".padEnd(34)} |`);
print(`| nReturned                | ${String(ixNReturned).padEnd(34)} | ${String(collNReturned).padEnd(34)} |`);
print(`| totalDocsExamined        | ${String(ixTotalDocsExamined).padEnd(34)} | ${String(collTotalDocsExamined).padEnd(34)} |`);
print(`| totalKeysExamined        | ${String(ixTotalKeysExamined).padEnd(34)} | ${String(collTotalKeysExamined).padEnd(34)} |`);
print(`| Documents Scanned Ratio  | ${String(ixTotalDocsExamined + "/" + collTotalDocsExamined + " (" + ((ixTotalDocsExamined/collTotalDocsExamined)*100).toFixed(1) + "%)").padEnd(34)} | ${String(collTotalDocsExamined + "/" + collTotalDocsExamined + " (100.0%)").padEnd(34)} |`);
print(`| Execution Time           | ${String(ixExecutionTimeMillis + " ms").padEnd(34)} | ${String(collExecutionTimeMillis + " ms").padEnd(34)} |`);
print(`+--------------------------+------------------------------------+------------------------------------+`);

banner("QUERY OPTIMIZATION TAKEAWAYS FOR REVIEW 2");
print(`  1. winningPlan:`);
print(`     • Index IX-06 utilizes an optimal compound B-tree index scan [IXSCAN] followed by [FETCH].`);
print(`     • The forced scan bypasses the B-tree and performs an exhaustive [COLLSCAN] over all documents.`);
print(`  2. nReturned vs totalDocsExamined:`);
print(`     • Index Scan Examined Ratio: ${ixTotalDocsExamined}/${ixNReturned} document examined per returned result (100% Index Selectivity, O(log N)).`);
print(`     • COLLSCAN Examined Ratio  : ${collTotalDocsExamined}/${collNReturned} documents examined per returned result (Exhaustive Scan, O(N)).`);
print(`  3. Scalability Impact:`);
print(`     • As inventory scales from 27 copies to 1,000,000 copies, COLLSCAN will examine 1,000,000 docs.`);
print(`     • Index IX-06 examines only the exact matching leaf nodes, maintaining constant O(log N) lookup latency.`);
print(`======================================================================================================\n`);
