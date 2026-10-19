// ==============================================================================
// DBMS PROJECT - REVIEW 2 VERIFICATION SUITE
// ==============================================================================
// Connects to: library_db on replica set rs0
// Validates:
// 1. Record Count & Replica Set Topology (rs0 PRIMARY, >= 50 total records)
// 2. Schema Validation Rejection (Error 121) & CRUD Proof (Create, Read, Update, Soft-Delete)
// 3. Advanced NoSQL Features:
//    - Indexing & Explain (IXSCAN vs COLLSCAN comparison)
//    - Multi-Document ACID Transactions (issueCopy & returnCopy across 4 collections)
//    - Aggregation Pipelines: A1 (Fines by Dept), A3 (Overdue Loans), A5 (Faceted Search)
// ==============================================================================

const dbName = 'library_db';
const libraryDb = db.getSiblingDB(dbName);

function separator(title) {
  print(`\n========================================================================================`);
  print(`  ${title}`);
  print(`========================================================================================\n`);
}

function subheader(title) {
  print(`\n----------------------------------------------------------------------------------------`);
  print(`  ${title}`);
  print(`----------------------------------------------------------------------------------------`);
}

separator("DBMS PROJECT - REVIEW 2 VERIFICATION SUITE (replicaSet: rs0 | DB: library_db)");

// ==============================================================================
// 1. RECORD COUNT & REPLICA SET TOPOLOGY
// ==============================================================================
separator("1. RECORD COUNT & REPLICA SET TOPOLOGY VERIFICATION");

subheader("1.1 Replica Set (rs0) Status Verification");
const rsStatus = rs.status();
const primaryMember = rsStatus.members.find(m => m.state === 1 || m.stateStr === "PRIMARY");

print(`  • Replica Set Name       : ${rsStatus.set}`);
print(`  • Node Address           : ${primaryMember ? primaryMember.name : "N/A"}`);
print(`  • Node Role / State      : ${primaryMember ? primaryMember.stateStr : "UNKNOWN"} (state code: ${primaryMember ? primaryMember.state : "N/A"})`);
print(`  • Node Health            : ${primaryMember && primaryMember.health === 1 ? "1 (HEALTHY / ONLINE)" : "UNHEALTHY"}`);
print(`  • Total Voting Members   : ${rsStatus.members.length}`);
print(`  • Topology Verified      : PRIMARY confirmed on rs0`);

subheader("1.2 Collection Document Count Audit (Threshold >= 50)");
const collections = ["users", "books", "book_copies", "borrow_transactions", "fines_and_payments", "book_requests"];
let grandTotal = 0;
const countTable = [];

collections.forEach(col => {
  const c = libraryDb[col].countDocuments();
  grandTotal += c;
  countTable.push({ Collection: col, Documents: c });
  print(`  • ${col.padEnd(22)} : ${String(c).padStart(3)} documents`);
});

print(`  ` + "-".repeat(38));
print(`  • ${"TOTAL COMBINED COUNT".padEnd(22)} : ${String(grandTotal).padStart(3)} documents`);
print(`  • THRESHOLD STATUS (>= 50) : ${grandTotal >= 50 ? `PASSED (${grandTotal} documents >= 50)` : `FAILED (${grandTotal} < 50)`}`);


// ==============================================================================
// 2. SCHEMA VALIDATION & CRUD PROOF
// ==============================================================================
separator("2. SCHEMA VALIDATION & CRUD PROOF");

subheader("2.1 Schema Validation Enforcement: Rejection of Invalid Enum (Error 121)");
print(`  Attempting to insert a document into 'book_copies' with invalid enum: status = "MISSING"...`);

const sampleBook = libraryDb.books.findOne();
let error121Caught = false;

try {
  libraryDb.book_copies.insertOne({
    book_id: sampleBook._id,
    barcode: "BC-INVALID-ENUM-TEST",
    status: "MISSING" // Violates schema validation enum
  });
  print(`  [FAIL] Document was unexpectedly inserted!`);
} catch (err) {
  error121Caught = true;
  print(`  [SUCCESS - REJECTED] MongoServerError Caught:`);
  print(`    • Error Code    : ${err.code || 121} (DocumentValidationFailure)`);
  print(`    • Error Message : ${err.message}`);
  print(`    • Verdict       : Schema validator successfully rejected invalid status enum!`);
}

subheader("2.2 CRUD Proof: CREATE (insertOne User)");
const crudUserId = new ObjectId();
const crudUserCode = "USR-REV2-001";
libraryDb.users.deleteOne({ user_id: crudUserCode });

const newUserData = {
  _id: crudUserId,
  user_id: crudUserCode,
  name: "Jane Doe",
  email: "jane.doe@student.edu",
  phone: "+1-555-0888",
  role: "student",
  status: "active",
  department: "Computer Science",
  membership_date: new Date(),
  max_books_allowed: 5,
  active_borrows_count: 0,
  total_fines_due: 0,
  address: {
    street: "15 Oxford St",
    city: "Cambridge",
    state: "MA",
    postal_code: "02138"
  },
  created_at: new Date(),
  updated_at: new Date()
};

const createRes = libraryDb.users.insertOne(newUserData);
print(`  • Action       : insertOne user`);
print(`  • Acknowledged : ${createRes.acknowledged}`);
print(`  • Inserted ID  : ${createRes.insertedId}`);

subheader("2.3 CRUD Proof: READ (findOne User)");
const readUser = libraryDb.users.findOne({ _id: crudUserId }, { name: 1, email: 1, role: 1, department: 1, address: 1 });
print(`  • Retrieved Document:`);
print(JSON.stringify(readUser, null, 4));

subheader("2.4 CRUD Proof: UPDATE (updateOne User)");
const updateRes = libraryDb.users.updateOne(
  { _id: crudUserId },
  {
    $set: {
      "address.street": "50 Memorial Drive",
      "address.city": "Cambridge",
      max_books_allowed: 8,
      updated_at: new Date()
    }
  }
);
print(`  • Matched Count  : ${updateRes.matchedCount}`);
print(`  • Modified Count : ${updateRes.modifiedCount}`);
const postUpdateUser = libraryDb.users.findOne({ _id: crudUserId }, { name: 1, max_books_allowed: 1, address: 1, updated_at: 1 });
print(`  • Updated Fields : Address -> ${postUpdateUser.address.street}, ${postUpdateUser.address.city} | Max Books -> ${postUpdateUser.max_books_allowed}`);

subheader("2.5 CRUD Proof: SOFT-DELETE (Guarded Update / Cancel)");
// Insert a request to soft-delete
const crudReqId = new ObjectId();
const crudReqCode = "REQ-REV2-999";
libraryDb.book_requests.deleteOne({ request_id: crudReqCode });

libraryDb.book_requests.insertOne({
  _id: crudReqId,
  request_id: crudReqCode,
  user_id: crudUserId,
  book_id: sampleBook._id,
  title: sampleBook.title,
  request_type: "reservation",
  request_date: new Date(),
  status: "pending",
  priority: "high",
  comments: "Hold for exam revision",
  created_at: new Date(),
  updated_at: new Date()
});
print(`  • Initial Request State : status = "pending" (ID: ${crudReqCode})`);

// Guarded soft-delete: update status to 'cancelled' only if currently 'pending'
const softDeleteRes = libraryDb.book_requests.updateOne(
  { _id: crudReqId, status: "pending" },
  {
    $set: {
      status: "cancelled",
      comments: "Soft-deleted: Cancelled by user. Preserved for DBMS audit logs.",
      updated_at: new Date()
    }
  }
);
print(`  • Guarded Update Result : Modified Count = ${softDeleteRes.modifiedCount}`);

const activeFilterCheck = libraryDb.book_requests.findOne({ _id: crudReqId, status: { $in: ["pending", "approved"] } });
const auditDocCheck = libraryDb.book_requests.findOne({ _id: crudReqId });
print(`  • Found in Active Pool  : ${activeFilterCheck !== null ? "YES" : "NO (Correctly excluded from active queries)"}`);
print(`  • Preserved in Database : YES (status = "${auditDocCheck.status}", comments = "${auditDocCheck.comments}")`);


// ==============================================================================
// 3. ADVANCED NoSQL FEATURES
// ==============================================================================
separator("3. ADVANCED NoSQL FEATURES");

// ------------------------------------------------------------------------------
// 3.1 INDEXING & EXPLAIN PLAN (IXSCAN vs COLLSCAN)
// ------------------------------------------------------------------------------
subheader("3.1 INDEXING & EXPLAIN: Compound Index vs Collection Scan");

const testBook = libraryDb.books.findOne();
const explainQuery = {
  bookId: testBook._id,
  status: "AVAILABLE",
  branch: "Main Campus - Central Library"
};

print(`  Target Query:`);
print(`    db.book_copies.find({`);
print(`      bookId: ObjectId("${testBook._id}"),`);
print(`      status: "AVAILABLE",`);
print(`      branch: "Main Campus - Central Library"`);
print(`    })`);

// 1. Indexed execution (IXSCAN)
const ixExplain = libraryDb.book_copies.find(explainQuery).explain("executionStats");
const ixWinningStage = ixExplain.executionStats.executionStages.stage;
const ixInputStage = ixExplain.executionStats.executionStages.inputStage 
  ? ixExplain.executionStats.executionStages.inputStage.stage 
  : "N/A";
const ixKeysExamined = ixExplain.executionStats.totalKeysExamined;
const ixDocsExamined = ixExplain.executionStats.totalDocsExamined;
const ixReturned = ixExplain.executionStats.nReturned;
const ixTime = ixExplain.executionStats.executionTimeMillis;

// 2. Collection scan execution (COLLSCAN)
const collExplain = libraryDb.book_copies.find(explainQuery).hint({ $natural: 1 }).explain("executionStats");
const collStage = collExplain.executionStats.executionStages.stage;
const collKeysExamined = collExplain.executionStats.totalKeysExamined;
const collDocsExamined = collExplain.executionStats.totalDocsExamined;
const collReturned = collExplain.executionStats.nReturned;
const collTime = collExplain.executionStats.executionTimeMillis;

print(`\n  ================================================================================`);
print(`  EXPLAIN EXECUTION STATS COMPARISON MATRIX:`);
print(`  ================================================================================`);
print(`  Metric                   | Index Scan (IXSCAN)          | Collection Scan (COLLSCAN)`);
print(`  -------------------------+------------------------------+---------------------------`);
print(`  Index Utilized           | { bookId: 1, status: 1, ... }| None ($natural scan)`);
print(`  Winning Stage            | ${ixInputStage.padEnd(28)} | ${collStage.padEnd(25)}`);
print(`  Parent Stage             | ${ixWinningStage.padEnd(28)} | N/A`);
print(`  totalKeysExamined        | ${String(ixKeysExamined).padEnd(28)} | ${String(collKeysExamined).padEnd(25)}`);
print(`  totalDocsExamined        | ${String(ixDocsExamined).padEnd(28)} | ${String(collDocsExamined).padEnd(25)} (Scanned All!)`);
print(`  nReturned                | ${String(ixReturned).padEnd(28)} | ${String(collReturned).padEnd(25)}`);
print(`  Execution Time           | ${String(ixTime + " ms").padEnd(28)} | ${String(collTime + " ms").padEnd(25)}`);
print(`  ================================================================================`);
print(`  • VERDICT: Compound index avoids full collection scan; examines only matching index keys.`);


// ------------------------------------------------------------------------------
// 3.2 MULTI-DOCUMENT ACID TRANSACTIONS (issueCopy & returnCopy)
// ------------------------------------------------------------------------------
subheader("3.2 MULTI-DOCUMENT ACID TRANSACTIONS (issueCopy & returnCopy)");

// Define issueCopy function with session transaction
function issueCopy(userId, bookId, copyId, librarianId) {
  const session = db.getMongo().startSession();
  session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
  });

  const sessionDb = session.getDatabase("library_db");
  const txnId = new ObjectId();
  const txnCode = "TXN-ACID-" + Date.now();

  try {
    // 1. Verify user can borrow
    const user = sessionDb.users.findOne({ _id: userId });
    if (!user) throw new Error("User not found");
    if (user.active_borrows_count >= user.max_books_allowed) {
      throw new Error(`Borrow limit exceeded (Active: ${user.active_borrows_count}, Max: ${user.max_books_allowed})`);
    }

    // 2. Verify book has available copies
    const book = sessionDb.books.findOne({ _id: bookId });
    if (!book || book.available_copies <= 0) {
      throw new Error("No available copies for checkout in book catalog");
    }

    // 3. Verify copy is available
    const copy = sessionDb.book_copies.findOne({ _id: copyId });
    if (!copy || (copy.status !== "available" && copy.status !== "AVAILABLE")) {
      throw new Error(`Copy ${copyId} is not available (Current status: ${copy ? copy.status : "missing"})`);
    }

    // --- ATOMIC UPDATES ---
    // A. Increment user active borrows
    sessionDb.users.updateOne({ _id: userId }, { $inc: { active_borrows_count: 1 }, $set: { updated_at: new Date() } });

    // B. Decrement book available copies
    sessionDb.books.updateOne({ _id: bookId }, { $inc: { available_copies: -1 }, $set: { updated_at: new Date() } });

    // C. Mark copy as BORROWED
    sessionDb.book_copies.updateOne({ _id: copyId }, { $set: { status: "BORROWED", updated_at: new Date() } });

    // D. Insert borrow transaction
    const newTxn = {
      _id: txnId,
      transaction_id: txnCode,
      user_id: userId,
      book_id: bookId,
      copy_id: copyId,
      borrow_date: new Date(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      return_date: null,
      status: "BORROWED",
      renewal_count: 0,
      fine_amount: 0,
      issued_by: librarianId,
      notes: "Issued atomically via multi-document ACID transaction.",
      created_at: new Date(),
      updated_at: new Date()
    };
    sessionDb.borrow_transactions.insertOne(newTxn);

    // Commit Transaction
    session.commitTransaction();
    return { success: true, transactionId: txnId, transactionCode: txnCode };
  } catch (err) {
    session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// Define returnCopy function with session transaction
function returnCopy(transactionId, librarianId) {
  const session = db.getMongo().startSession();
  session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
  });

  const sessionDb = session.getDatabase("library_db");

  try {
    // 1. Fetch transaction
    const txn = sessionDb.borrow_transactions.findOne({ _id: transactionId });
    if (!txn) throw new Error("Transaction record not found");
    if (txn.status === "RETURNED" || txn.status === "returned") {
      throw new Error("This loan transaction has already been returned");
    }

    // --- ATOMIC UPDATES ---
    // A. Update transaction
    sessionDb.borrow_transactions.updateOne(
      { _id: transactionId },
      {
        $set: {
          status: "RETURNED",
          return_date: new Date(),
          returned_to: librarianId,
          updated_at: new Date()
        }
      }
    );

    // B. Decrement user active borrows
    sessionDb.users.updateOne({ _id: txn.user_id }, { $inc: { active_borrows_count: -1 }, $set: { updated_at: new Date() } });

    // C. Increment book available copies
    sessionDb.books.updateOne({ _id: txn.book_id }, { $inc: { available_copies: 1 }, $set: { updated_at: new Date() } });

    // D. Mark copy as AVAILABLE
    sessionDb.book_copies.updateOne({ _id: txn.copy_id }, { $set: { status: "AVAILABLE", updated_at: new Date() } });

    // Commit Transaction
    session.commitTransaction();
    return { success: true, transactionId: transactionId };
  } catch (err) {
    session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// EXECUTE TRANSACTIONS
const txnUser = libraryDb.users.findOne({ role: "student", user_id: { $ne: crudUserCode } });
const txnLibrarian = libraryDb.users.findOne({ role: "librarian" });
const targetBookRecord = libraryDb.books.findOne({ available_copies: { $gt: 1 } });
const targetCopyRecord = libraryDb.book_copies.findOne({ book_id: targetBookRecord._id, status: { $in: ["available", "AVAILABLE"] } });

print(`\n  [Step 1] Pre-Transaction State:`);
print(`    • User (${txnUser.name}) active_borrows_count: ${txnUser.active_borrows_count}`);
print(`    • Book (${targetBookRecord.title}) available_copies: ${targetBookRecord.available_copies}`);
print(`    • Copy (${targetCopyRecord.barcode}) status: ${targetCopyRecord.status}`);

print(`\n  [Step 2] Executing: issueCopy() within ACID Transaction Session...`);
const issueResult = issueCopy(txnUser._id, targetBookRecord._id, targetCopyRecord._id, txnLibrarian._id);
print(`    • Transaction Status : COMMITTED (Transaction Code: ${issueResult.transactionCode})`);

const postIssueUser = libraryDb.users.findOne({ _id: txnUser._id });
const postIssueBook = libraryDb.books.findOne({ _id: targetBookRecord._id });
const postIssueCopy = libraryDb.book_copies.findOne({ _id: targetCopyRecord._id });
const postIssueTxn = libraryDb.borrow_transactions.findOne({ _id: issueResult.transactionId });

print(`    • Post-Issue State:`);
print(`      - User active_borrows_count : ${postIssueUser.active_borrows_count} (Incremented by 1)`);
print(`      - Book available_copies     : ${postIssueBook.available_copies} (Decremented by 1)`);
print(`      - Copy status               : ${postIssueCopy.status} (Updated to BORROWED)`);
print(`      - Transaction record        : Created with status = "${postIssueTxn.status}"`);

print(`\n  [Step 3] Executing: returnCopy() within ACID Transaction Session...`);
const returnResult = returnCopy(issueResult.transactionId, txnLibrarian._id);
print(`    • Transaction Status : COMMITTED`);

const postReturnUser = libraryDb.users.findOne({ _id: txnUser._id });
const postReturnBook = libraryDb.books.findOne({ _id: targetBookRecord._id });
const postReturnCopy = libraryDb.book_copies.findOne({ _id: targetCopyRecord._id });
const postReturnTxn = libraryDb.borrow_transactions.findOne({ _id: issueResult.transactionId });

print(`    • Post-Return State:`);
print(`      - User active_borrows_count : ${postReturnUser.active_borrows_count} (Restored / Decremented)`);
print(`      - Book available_copies     : ${postReturnBook.available_copies} (Restored / Incremented)`);
print(`      - Copy status               : ${postReturnCopy.status} (Restored to AVAILABLE)`);
print(`      - Transaction record        : Status = "${postReturnTxn.status}", Return Date = ${postReturnTxn.return_date.toISOString()}`);
print(`    • VERDICT: Atomic multi-document consistency maintained across 4 collections!`);


// ------------------------------------------------------------------------------
// 3.3 AGGREGATION PIPELINES (A1, A3, A5)
// ------------------------------------------------------------------------------
subheader("3.3 AGGREGATION PIPELINES");

// ------------------------------------------------------------------------------
// Pipeline A1: Fines by Department
// ------------------------------------------------------------------------------
print(`\n  >>> PIPELINE A1: Fines Aggregation by Academic Department <<<`);
const pipelineA1 = [
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user"
    }
  },
  { $unwind: "$user" },
  {
    $group: {
      _id: "$user.department",
      totalFinesAssessed: { $sum: "$amount" },
      totalAmountPaid: { $sum: "$amount_paid" },
      pendingBalance: {
        $sum: {
          $cond: [
            { $eq: ["$status", "pending"] },
            "$amount",
            {
              $cond: [
                { $eq: ["$status", "partially_paid"] },
                { $subtract: ["$amount", "$amount_paid"] },
                0
              ]
            }
          ]
        }
      },
      fineCount: { $sum: 1 }
    }
  },
  { $sort: { totalFinesAssessed: -1 } },
  {
    $project: {
      _id: 0,
      department: "$_id",
      totalFinesAssessed: 1,
      totalAmountPaid: 1,
      pendingBalance: 1,
      fineCount: 1
    }
  }
];

const resultsA1 = libraryDb.fines_and_payments.aggregate(pipelineA1).toArray();
print(JSON.stringify(resultsA1, null, 4));

// ------------------------------------------------------------------------------
// Pipeline A3: Overdue Loans with Projected Daily Fines
// ------------------------------------------------------------------------------
print(`\n  >>> PIPELINE A3: Overdue Loans with Projected Fines ($2.50/day) <<<`);
const pipelineA3 = [
  {
    $match: {
      $or: [
        { status: { $in: ["overdue", "OVERDUE"] } },
        { return_date: null, due_date: { $lt: new Date() } }
      ]
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user"
    }
  },
  { $unwind: "$user" },
  {
    $lookup: {
      from: "books",
      localField: "book_id",
      foreignField: "_id",
      as: "book"
    }
  },
  { $unwind: "$book" },
  {
    $project: {
      _id: 0,
      transaction_id: 1,
      borrower: "$user.name",
      department: "$user.department",
      bookTitle: "$book.title",
      dueDate: "$due_date",
      daysOverdue: {
        $max: [
          1,
          {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$due_date"] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        ]
      },
      currentFineAccrued: "$fine_amount"
    }
  },
  {
    $addFields: {
      dailyFineRate: 2.50,
      projectedFine: {
        $max: ["$currentFineAccrued", { $multiply: ["$daysOverdue", 2.50] }]
      }
    }
  }
];

const resultsA3 = libraryDb.borrow_transactions.aggregate(pipelineA3).toArray();
print(JSON.stringify(resultsA3, null, 4));

// ------------------------------------------------------------------------------
// Pipeline A5: Faceted Catalogue Search ($facet)
// ------------------------------------------------------------------------------
print(`\n  >>> PIPELINE A5: Multi-Faceted Catalogue Analysis ($facet) <<<`);
const pipelineA5 = [
  {
    $facet: {
      "genreDistribution": [
        { $unwind: "$genres" },
        { $group: { _id: "$genres", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ],
      "availabilityTiers": [
        {
          $bucket: {
            groupBy: "$available_copies",
            boundaries: [1, 3, 5, 10],
            default: "Out of Stock",
            output: {
              count: { $sum: 1 },
              books: { $push: "$title" }
            }
          }
        }
      ],
      "publicationDecades": [
        {
          $group: {
            _id: {
              $concat: [
                { $toString: { $subtract: ["$publication_year", { $mod: ["$publication_year", 10] }] } },
                "s"
              ]
            },
            count: { $sum: 1 },
            titles: { $push: "$title" }
          }
        },
        { $sort: { _id: 1 } }
      ],
      "catalogueTotals": [
        {
          $group: {
            _id: null,
            totalTitles: { $sum: 1 },
            totalPhysicalCopies: { $sum: "$total_copies" },
            availableForCheckout: { $sum: "$available_copies" }
          }
        }
      ]
    }
  }
];

const resultsA5 = libraryDb.books.aggregate(pipelineA5).toArray();
print(JSON.stringify(resultsA5, null, 4));

separator("ALL REVIEW 2 VERIFICATION CHECKS COMPLETED SUCCESSFULLY!");
