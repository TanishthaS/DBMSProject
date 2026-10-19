// ==============================================================================
// CRUD Demonstration Script for library_db
// ==============================================================================
// This script demonstrates and logs the 4 essential CRUD operations:
// 1. CREATE: Insert a new user (with schema validation compliance)
// 2. READ:   Find active/available books in the catalog
// 3. UPDATE: Update a user's address and timestamp
// 4. DELETE: Soft-delete a book request (set status to 'cancelled')
// ==============================================================================

const dbName = 'library_db';
const libraryDb = db.getSiblingDB(dbName);

print(`\n==============================================================================`);
print(`  LIBRARY MANAGEMENT SYSTEM - MONGODB CRUD DEMONSTRATION`);
print(`  Target Database: ${dbName}`);
print(`==============================================================================\n`);

// Helper for formatted section headers
function printHeader(opNumber, opName, description) {
  print(`------------------------------------------------------------------------------`);
  print(`OPERATION ${opNumber}: [${opName}] - ${description}`);
  print(`------------------------------------------------------------------------------`);
}

// ==============================================================================
// OPERATION 1: CREATE - Insert a new user
// ==============================================================================
printHeader("1", "CREATE", "Insert a new student user into 'users' collection");

const demoUserId = new ObjectId();
const demoUserCode = "USR-DEMO-001";
const demoUserEmail = "maya.lin@student.edu";

// Clean up any existing demo user from prior runs for idempotency
libraryDb.users.deleteOne({ user_id: demoUserCode });

const newUserDoc = {
  _id: demoUserId,
  user_id: demoUserCode,
  name: "Maya Lin",
  email: demoUserEmail,
  phone: "+1-555-0999",
  role: "student",
  status: "active",
  membership_date: new Date(),
  max_books_allowed: 5,
  active_borrows_count: 0,
  total_fines_due: 0,
  address: {
    street: "128 Technology Square",
    city: "Cambridge",
    state: "MA",
    postal_code: "02139"
  },
  created_at: new Date(),
  updated_at: new Date()
};

print(`Executing: db.users.insertOne(newUserDoc)`);
const insertResult = libraryDb.users.insertOne(newUserDoc);

print(`\nResult:`);
print(`  - Acknowledged : ${insertResult.acknowledged}`);
print(`  - Inserted _id : ${insertResult.insertedId}`);

// Verify document in collection
const insertedUser = libraryDb.users.findOne({ _id: demoUserId });
print(`\nInserted Document in 'users':`);
print(JSON.stringify(insertedUser, null, 2));


// ==============================================================================
// OPERATION 2: READ - Find active books
// ==============================================================================
printHeader("2", "READ", "Query active books with available copies (available_copies > 0)");

print(`Executing: db.books.find({ available_copies: { $gt: 0 } }, { projection, sort })`);

const activeBooksCursor = libraryDb.books.find(
  { available_copies: { $gt: 0 } },
  {
    isbn: 1,
    title: 1,
    authors: 1,
    total_copies: 1,
    available_copies: 1,
    shelf_location: 1
  }
).sort({ available_copies: -1 });

const activeBooks = activeBooksCursor.toArray();

print(`\nFound ${activeBooks.length} active books available for checkout:\n`);
activeBooks.forEach((book, index) => {
  print(`  [${index + 1}] "${book.title}"`);
  print(`      ISBN: ${book.isbn} | Authors: ${book.authors.join(", ")}`);
  print(`      Availability: ${book.available_copies}/${book.total_copies} copies | Shelf: ${book.shelf_location}`);
});


// ==============================================================================
// OPERATION 3: UPDATE - Update user address
// ==============================================================================
printHeader("3", "UPDATE", `Update address and timestamp for user: ${demoUserCode}`);

const newAddress = {
  street: "500 Innovation Way, Suite 400",
  city: "Boston",
  state: "MA",
  postal_code: "02210"
};

print(`Original Address:`);
print(`  ${insertedUser.address.street}, ${insertedUser.address.city}, ${insertedUser.address.state} ${insertedUser.address.postal_code}`);

print(`\nExecuting: db.users.updateOne({ _id: ... }, { $set: { address: ..., updated_at: ... } })`);

const updateResult = libraryDb.users.updateOne(
  { _id: demoUserId },
  {
    $set: {
      address: newAddress,
      updated_at: new Date()
    }
  }
);

print(`\nResult:`);
print(`  - Matched Count  : ${updateResult.matchedCount}`);
print(`  - Modified Count : ${updateResult.modifiedCount}`);

// Fetch and display updated document
const updatedUser = libraryDb.users.findOne({ _id: demoUserId });
print(`\nUpdated Document in 'users':`);
print(JSON.stringify({
  _id: updatedUser._id,
  user_id: updatedUser.user_id,
  name: updatedUser.name,
  address: updatedUser.address,
  updated_at: updatedUser.updated_at
}, null, 2));


// ==============================================================================
// OPERATION 4: DELETE (Soft-Delete) - Soft-delete a book request
// ==============================================================================
printHeader("4", "DELETE (SOFT-DELETE)", "Soft-delete a book request by changing status to 'cancelled'");

// First, insert a demo book request for Maya Lin so we can demonstrate its complete lifecycle
const demoRequestId = new ObjectId();
const demoRequestCode = "REQ-DEMO-001";
const targetBook = libraryDb.books.findOne({ available_copies: { $gt: 0 } });

libraryDb.book_requests.deleteOne({ request_id: demoRequestCode });

const newRequestDoc = {
  _id: demoRequestId,
  request_id: demoRequestCode,
  user_id: demoUserId,
  book_id: targetBook._id,
  title: targetBook.title,
  author: targetBook.authors[0],
  isbn: targetBook.isbn,
  request_type: "reservation",
  request_date: new Date(),
  status: "pending",
  priority: "medium",
  comments: "Demo hold request for upcoming research project.",
  created_at: new Date(),
  updated_at: new Date()
};

libraryDb.book_requests.insertOne(newRequestDoc);
print(`Created initial book request:`);
print(`  Request ID : ${newRequestDoc.request_id}`);
print(`  Title      : "${newRequestDoc.title}"`);
print(`  Status     : ${newRequestDoc.status}`);

print(`\nExecuting Soft-Delete: db.book_requests.updateOne(...)`);
print(`Setting status to 'cancelled' with cancellation audit notes...`);

const softDeleteResult = libraryDb.book_requests.updateOne(
  { _id: demoRequestId },
  {
    $set: {
      status: "cancelled",
      comments: "Request cancelled by user (soft-deleted). Retained for DBMS audit history.",
      updated_at: new Date()
    }
  }
);

print(`\nResult:`);
print(`  - Matched Count  : ${softDeleteResult.matchedCount}`);
print(`  - Modified Count : ${softDeleteResult.modifiedCount}`);

// Verify soft-delete behavior:
// 1. Active query: filtered out
const activeRequestCheck = libraryDb.book_requests.findOne({
  _id: demoRequestId,
  status: { $in: ["pending", "approved"] }
});
print(`\nVerification 1 - Active Requests Query (status in ['pending', 'approved']):`);
print(`  Found in active filter? ${activeRequestCheck !== null ? "YES" : "NO (Successfully filtered out)"}`);

// 2. Audit/Historical query: preserved in database
const auditRequestCheck = libraryDb.book_requests.findOne({ _id: demoRequestId });
print(`\nVerification 2 - Audit/Historical Query (by ID):`);
print(JSON.stringify({
  _id: auditRequestCheck._id,
  request_id: auditRequestCheck.request_id,
  title: auditRequestCheck.title,
  status: auditRequestCheck.status,
  comments: auditRequestCheck.comments,
  updated_at: auditRequestCheck.updated_at
}, null, 2));

print(`\n==============================================================================`);
print(`  CRUD DEMONSTRATION COMPLETED SUCCESSFULLY!`);
print(`==============================================================================\n`);
