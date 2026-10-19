// Validation test script for library_db
const dbName = 'library_db';
const libraryDb = db.getSiblingDB(dbName);

print(`====================================================`);
print(`Testing Schema Validation in: ${dbName}`);
print(`====================================================`);

let allTestsPassed = true;

function testValidation(testName, actionFn, shouldSucceed) {
  try {
    actionFn();
    if (shouldSucceed) {
      print(`  [PASS] ${testName} (Succeeded as expected)`);
    } else {
      print(`  [FAIL] ${testName} (Expected failure but operation succeeded!)`);
      allTestsPassed = false;
    }
  } catch (err) {
    if (!shouldSucceed) {
      print(`  [PASS] ${testName} (Rejected as expected: ${err.message || err})`);
    } else {
      print(`  [FAIL] ${testName} (Expected success but got error: ${err.message || err})`);
      allTestsPassed = false;
    }
  }
}

// 1. Test Users Collection
print(`\nTesting 'users' Collection:`);
const testUserId = new ObjectId();
testValidation("Insert valid user", () => {
  libraryDb.users.insertOne({
    _id: testUserId,
    user_id: "TEST-USR-999",
    name: "Test User",
    email: "test.validation.user@example.com",
    role: "student",
    status: "active",
    membership_date: new Date(),
    max_books_allowed: 5,
    active_borrows_count: 0,
    total_fines_due: 0
  });
}, true);

testValidation("Reject user with invalid email format", () => {
  libraryDb.users.insertOne({
    name: "Bad Email User",
    email: "not-an-email",
    role: "student",
    status: "active"
  });
}, false);

testValidation("Reject user missing required 'role'", () => {
  libraryDb.users.insertOne({
    name: "No Role User",
    email: "norole@example.com",
    status: "active"
  });
}, false);

// 2. Test Books Collection
print(`\nTesting 'books' Collection:`);
const testBookId = new ObjectId();
testValidation("Insert valid book", () => {
  libraryDb.books.insertOne({
    _id: testBookId,
    isbn: "978-9999999999",
    title: "Test Book For Validation",
    authors: ["Robert C. Martin"],
    publisher: "Test Hall",
    publication_year: 2026,
    total_copies: 3,
    available_copies: 3
  });
}, true);

testValidation("Reject book with negative copy count", () => {
  libraryDb.books.insertOne({
    isbn: "978-0000000000",
    title: "Negative Copies",
    authors: ["Test Author"],
    total_copies: -1,
    available_copies: 0
  });
}, false);

testValidation("Reject book with empty authors array", () => {
  libraryDb.books.insertOne({
    isbn: "978-0000000001",
    title: "No Author",
    authors: [],
    total_copies: 1,
    available_copies: 1
  });
}, false);

// 3. Test Book Copies Collection
print(`\nTesting 'book_copies' Collection:`);
const testCopyId = new ObjectId();
testValidation("Insert valid book copy", () => {
  libraryDb.book_copies.insertOne({
    _id: testCopyId,
    book_id: testBookId,
    barcode: "TEST-BC-9999",
    copy_number: 1,
    status: "available",
    condition: "good",
    shelf_location: "TEST-A1"
  });
}, true);

testValidation("Reject book copy with invalid status enum", () => {
  libraryDb.book_copies.insertOne({
    book_id: testBookId,
    barcode: "TEST-BC-INVALID",
    status: "disintegrated" // invalid enum value
  });
}, false);

// 4. Test Borrow Transactions Collection
print(`\nTesting 'borrow_transactions' Collection:`);
const testTxnId = new ObjectId();
testValidation("Insert valid borrow transaction", () => {
  libraryDb.borrow_transactions.insertOne({
    _id: testTxnId,
    transaction_id: "TEST-TXN-9999",
    user_id: testUserId,
    book_id: testBookId,
    copy_id: testCopyId,
    borrow_date: new Date(),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: "borrowed",
    renewal_count: 0,
    fine_amount: 0
  });
}, true);

testValidation("Reject borrow transaction missing due_date", () => {
  libraryDb.borrow_transactions.insertOne({
    user_id: testUserId,
    book_id: testBookId,
    copy_id: testCopyId,
    borrow_date: new Date(),
    status: "borrowed"
  });
}, false);

// 5. Test Fines and Payments Collection
print(`\nTesting 'fines_and_payments' Collection:`);
const testFineId = new ObjectId();
testValidation("Insert valid fine payment", () => {
  libraryDb.fines_and_payments.insertOne({
    _id: testFineId,
    fine_id: "TEST-FINE-9999",
    transaction_id: testTxnId,
    user_id: testUserId,
    amount: 15.50,
    fine_reason: "overdue",
    status: "paid",
    amount_paid: 15.50,
    payment_method: "upi",
    paid_date: new Date()
  });
}, true);

testValidation("Reject fine with invalid fine_reason", () => {
  libraryDb.fines_and_payments.insertOne({
    user_id: testUserId,
    amount: 20,
    fine_reason: "random_penalty", // invalid enum
    status: "pending"
  });
}, false);

// 6. Test Book Requests Collection
print(`\nTesting 'book_requests' Collection:`);
const testRequestId = new ObjectId();
testValidation("Insert valid book request", () => {
  libraryDb.book_requests.insertOne({
    _id: testRequestId,
    request_id: "TEST-REQ-9999",
    user_id: testUserId,
    book_id: testBookId,
    title: "Clean Architecture",
    author: "Robert C. Martin",
    request_type: "reservation",
    request_date: new Date(),
    status: "pending",
    priority: "high"
  });
}, true);

testValidation("Reject book request with invalid request_type", () => {
  libraryDb.book_requests.insertOne({
    user_id: testUserId,
    title: "Invalid Request",
    request_type: "steal", // invalid enum
    request_date: new Date(),
    status: "pending"
  });
}, false);

// Cleanup test data
print(`\nCleaning up test documents...`);
libraryDb.users.deleteOne({ _id: testUserId });
libraryDb.books.deleteOne({ _id: testBookId });
libraryDb.book_copies.deleteOne({ _id: testCopyId });
libraryDb.borrow_transactions.deleteOne({ _id: testTxnId });
libraryDb.fines_and_payments.deleteOne({ _id: testFineId });
libraryDb.book_requests.deleteOne({ _id: testRequestId });
print(`✓ Cleaned up test data.`);

print(`\n====================================================`);
if (allTestsPassed) {
  print(`ALL SCHEMA VALIDATION TESTS PASSED! 🎉`);
} else {
  print(`SOME TESTS FAILED! Check output above.`);
}
print(`====================================================`);
