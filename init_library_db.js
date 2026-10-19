// MongoDB Initialization Script for Library Management System
// Target Database: library_db

const dbName = 'library_db';
const libraryDb = db.getSiblingDB(dbName);

print(`====================================================`);
print(`Setting up collections and schema validation for: ${dbName}`);
print(`====================================================`);

// 1. USERS COLLECTION SCHEMA
const usersSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "email", "role", "status"],
    properties: {
      _id: { bsonType: "objectId" },
      user_id: {
        bsonType: "string",
        description: "Unique string identifier for member/card"
      },
      name: {
        bsonType: "string",
        description: "Full name of the user - required"
      },
      email: {
        bsonType: "string",
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        description: "Must be a valid email address - required"
      },
      phone: {
        bsonType: "string",
        description: "Contact phone number"
      },
      role: {
        enum: ["student", "faculty", "staff", "librarian", "admin", "member"],
        description: "User role - required"
      },
      status: {
        enum: ["active", "suspended", "inactive", "expired"],
        description: "Account status - required"
      },
      membership_date: {
        bsonType: "date",
        description: "Date of joining/registration"
      },
      expiry_date: {
        bsonType: "date",
        description: "Date when membership expires"
      },
      max_books_allowed: {
        bsonType: ["int", "long", "double"],
        minimum: 0,
        description: "Max books allowed to be borrowed simultaneously"
      },
      active_borrows_count: {
        bsonType: ["int", "long", "double"],
        minimum: 0,
        description: "Count of currently borrowed books"
      },
      total_fines_due: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
        description: "Total unpaid fines accumulated"
      },
      department: {
        bsonType: "string",
        description: "Academic or administrative department"
      },
      address: {
        bsonType: "object",
        properties: {
          street: { bsonType: "string" },
          city: { bsonType: "string" },
          state: { bsonType: "string" },
          postal_code: { bsonType: "string" }
        }
      },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" }
    }
  }
};

// 2. BOOKS COLLECTION SCHEMA
const booksSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["isbn", "title", "authors", "total_copies", "available_copies"],
    properties: {
      _id: { bsonType: "objectId" },
      isbn: {
        bsonType: "string",
        description: "ISBN of the book - required"
      },
      title: {
        bsonType: "string",
        description: "Title of the book - required"
      },
      authors: {
        bsonType: "array",
        minItems: 1,
        items: {
          bsonType: "string"
        },
        description: "Array of author names - required with at least 1 author"
      },
      publisher: {
        bsonType: "string",
        description: "Book publisher"
      },
      publication_year: {
        bsonType: ["int", "long", "double"],
        description: "Year book was published"
      },
      edition: {
        bsonType: "string",
        description: "Edition description"
      },
      genres: {
        bsonType: "array",
        items: { bsonType: "string" },
        description: "Genres or categories"
      },
      language: {
        bsonType: "string",
        description: "Language of the book"
      },
      total_copies: {
        bsonType: ["int", "long", "double"],
        minimum: 0,
        description: "Total copies in collection - required"
      },
      available_copies: {
        bsonType: ["int", "long", "double"],
        minimum: 0,
        description: "Currently available copies for checkout - required"
      },
      shelf_location: {
        bsonType: "string",
        description: "Call number or shelf location"
      },
      description: {
        bsonType: "string",
        description: "Synopsis/summary of the book"
      },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" }
    }
  }
};

// 3. BOOK_COPIES COLLECTION SCHEMA
const bookCopiesSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["book_id", "barcode", "status"],
    properties: {
      _id: { bsonType: "objectId" },
      book_id: {
        bsonType: "objectId",
        description: "Reference to parent books._id - required"
      },
      bookId: {
        bsonType: "objectId",
        description: "Reference to parent books._id (alias)"
      },
      barcode: {
        bsonType: "string",
        description: "Unique barcode/accession number for this physical copy - required"
      },
      copy_number: {
        bsonType: ["int", "long", "double", "string"],
        description: "Copy index/number"
      },
      status: {
        enum: ["available", "borrowed", "reserved", "maintenance", "lost", "damaged", "AVAILABLE", "BORROWED", "RESERVED", "MAINTENANCE", "LOST", "DAMAGED"],
        description: "Physical status of this copy - required"
      },
      condition: {
        enum: ["new", "good", "fair", "poor", "damaged", "NEW", "GOOD", "FAIR", "POOR", "DAMAGED"],
        description: "Condition of this physical copy"
      },
      branch: {
        bsonType: "string",
        description: "Library branch location"
      },
      shelf_location: {
        bsonType: "string",
        description: "Physical location (rack/aisle)"
      },
      acquired_date: {
        bsonType: "date",
        description: "Date acquired by library"
      },
      price: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
        description: "Purchase/replacement cost"
      },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" }
    }
  }
};

// 4. BORROW_TRANSACTIONS COLLECTION SCHEMA
const borrowTransactionsSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["user_id", "book_id", "copy_id", "borrow_date", "due_date", "status"],
    properties: {
      _id: { bsonType: "objectId" },
      transaction_id: {
        bsonType: "string",
        description: "Unique human-readable transaction identifier"
      },
      user_id: {
        bsonType: "objectId",
        description: "Reference to users._id - required"
      },
      book_id: {
        bsonType: "objectId",
        description: "Reference to books._id - required"
      },
      copy_id: {
        bsonType: "objectId",
        description: "Reference to book_copies._id - required"
      },
      borrow_date: {
        bsonType: "date",
        description: "Checkout timestamp - required"
      },
      due_date: {
        bsonType: "date",
        description: "Due date for return - required"
      },
      return_date: {
        bsonType: ["date", "null"],
        description: "Actual return timestamp (null if still borrowed)"
      },
      status: {
        enum: ["borrowed", "returned", "overdue", "lost", "BORROWED", "RETURNED", "OVERDUE", "LOST"],
        description: "Status of this borrow transaction - required"
      },
      renewal_count: {
        bsonType: ["int", "long", "double"],
        minimum: 0,
        description: "Number of times loan was renewed"
      },
      fine_amount: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
        description: "Fine accumulated on this transaction"
      },
      issued_by: {
        bsonType: ["objectId", "string"],
        description: "Staff/librarian who issued the book"
      },
      returned_to: {
        bsonType: ["objectId", "string"],
        description: "Staff/librarian who checked the book in"
      },
      notes: {
        bsonType: "string",
        description: "Transaction notes"
      },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" }
    }
  }
};

// 5. FINES_AND_PAYMENTS COLLECTION SCHEMA
const finesAndPaymentsSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["user_id", "amount", "fine_reason", "status"],
    properties: {
      _id: { bsonType: "objectId" },
      fine_id: {
        bsonType: "string",
        description: "Unique receipt/fine ID"
      },
      transaction_id: {
        bsonType: ["objectId", "null"],
        description: "Reference to borrow_transactions._id (optional)"
      },
      user_id: {
        bsonType: "objectId",
        description: "Reference to users._id - required"
      },
      amount: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
        description: "Total fine or fee amount - required"
      },
      fine_reason: {
        enum: ["overdue", "damaged_book", "lost_book", "membership_fee", "replacement", "other"],
        description: "Reason for the fine/fee - required"
      },
      status: {
        enum: ["pending", "paid", "waived", "partially_paid"],
        description: "Current payment status - required"
      },
      amount_paid: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
        description: "Amount paid towards fine"
      },
      issued_date: {
        bsonType: "date",
        description: "Date fine was issued"
      },
      paid_date: {
        bsonType: ["date", "null"],
        description: "Date payment was completed"
      },
      payment_method: {
        enum: ["cash", "card", "upi", "online", "net_banking", "waiver", "pending"],
        description: "Payment channel"
      },
      receipt_number: {
        bsonType: "string",
        description: "Official receipt number"
      },
      processed_by: {
        bsonType: ["objectId", "string"],
        description: "Librarian/staff member"
      },
      remarks: {
        bsonType: "string",
        description: "Notes or reason for waiver"
      },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" }
    }
  }
};

// 6. BOOK_REQUESTS COLLECTION SCHEMA
const bookRequestsSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["user_id", "title", "request_type", "request_date", "status"],
    properties: {
      _id: { bsonType: "objectId" },
      request_id: {
        bsonType: "string",
        description: "Unique request identifier"
      },
      user_id: {
        bsonType: "objectId",
        description: "Reference to users._id - required"
      },
      book_id: {
        bsonType: ["objectId", "null"],
        description: "Reference to books._id (null if requesting a new book not in catalog)"
      },
      title: {
        bsonType: "string",
        description: "Book title - required"
      },
      author: {
        bsonType: "string",
        description: "Book author"
      },
      isbn: {
        bsonType: "string",
        description: "ISBN if known"
      },
      request_type: {
        enum: ["hold", "reservation", "procurement", "renewal"],
        description: "Type of book request - required"
      },
      request_date: {
        bsonType: "date",
        description: "Timestamp when request was made - required"
      },
      status: {
        enum: ["pending", "approved", "fulfilled", "rejected", "cancelled"],
        description: "Request processing status - required"
      },
      fulfilled_date: {
        bsonType: ["date", "null"],
        description: "Timestamp when fulfilled"
      },
      expiry_date: {
        bsonType: ["date", "null"],
        description: "Hold/reservation expiration date"
      },
      priority: {
        enum: ["low", "medium", "high"],
        description: "Request urgency priority"
      },
      comments: {
        bsonType: "string",
        description: "User notes or comments"
      },
      reviewed_by: {
        bsonType: ["objectId", "string"],
        description: "Staff reviewer"
      },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" }
    }
  }
};

// HELPER FUNCTION: Create or update collection validator
function createOrUpdateCollection(colName, schema) {
  const collections = libraryDb.getCollectionNames();
  if (collections.includes(colName)) {
    print(`Collection '${colName}' already exists. Updating schema validator...`);
    libraryDb.runCommand({
      collMod: colName,
      validator: schema,
      validationLevel: "strict",
      validationAction: "error"
    });
    print(`✓ Schema validator updated for '${colName}'.`);
  } else {
    print(`Creating collection '${colName}' with schema validator...`);
    libraryDb.createCollection(colName, {
      validator: schema,
      validationLevel: "strict",
      validationAction: "error"
    });
    print(`✓ Collection '${colName}' created successfully.`);
  }
}

// CREATE COLLECTIONS
createOrUpdateCollection("users", usersSchema);
createOrUpdateCollection("books", booksSchema);
createOrUpdateCollection("book_copies", bookCopiesSchema);
createOrUpdateCollection("borrow_transactions", borrowTransactionsSchema);
createOrUpdateCollection("fines_and_payments", finesAndPaymentsSchema);
createOrUpdateCollection("book_requests", bookRequestsSchema);

print(`\n====================================================`);
print(`Creating Indexes for Performance and Uniqueness`);
print(`====================================================`);

// INDEXES
libraryDb.users.createIndex({ email: 1 }, { unique: true });
libraryDb.users.createIndex({ user_id: 1 }, { unique: true, sparse: true });
libraryDb.users.createIndex({ role: 1 });
libraryDb.users.createIndex({ status: 1 });
libraryDb.users.createIndex({ department: 1 });
print(`✓ Indexes created on 'users'`);

libraryDb.books.createIndex({ isbn: 1 }, { unique: true });
libraryDb.books.createIndex({ title: "text", description: "text" });
libraryDb.books.createIndex({ authors: 1 });
libraryDb.books.createIndex({ genres: 1 });
print(`✓ Indexes created on 'books'`);

libraryDb.book_copies.createIndex({ barcode: 1 }, { unique: true });
libraryDb.book_copies.createIndex({ book_id: 1, status: 1 });
libraryDb.book_copies.createIndex({ bookId: 1, status: 1, branch: 1 });
print(`✓ Indexes created on 'book_copies'`);

libraryDb.borrow_transactions.createIndex({ user_id: 1, status: 1 });
libraryDb.borrow_transactions.createIndex({ copy_id: 1, status: 1 });
libraryDb.borrow_transactions.createIndex({ due_date: 1 });
libraryDb.borrow_transactions.createIndex({ transaction_id: 1 }, { unique: true, sparse: true });
print(`✓ Indexes created on 'borrow_transactions'`);

libraryDb.fines_and_payments.createIndex({ user_id: 1, status: 1 });
libraryDb.fines_and_payments.createIndex({ transaction_id: 1 });
libraryDb.fines_and_payments.createIndex({ fine_id: 1 }, { unique: true, sparse: true });
print(`✓ Indexes created on 'fines_and_payments'`);

libraryDb.book_requests.createIndex({ user_id: 1, status: 1 });
libraryDb.book_requests.createIndex({ book_id: 1 });
libraryDb.book_requests.createIndex({ request_date: 1 });
print(`✓ Indexes created on 'book_requests'`);

print(`\n====================================================`);
print(`Listing all collections in ${dbName}:`);
print(JSON.stringify(libraryDb.getCollectionNames(), null, 2));
print(`====================================================`);
print(`Library database setup completed successfully!`);
