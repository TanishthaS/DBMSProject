# Library Management System - MongoDB Setup

This project uses MongoDB configured as a single-node replica set (`rs0`) on `localhost:27017` to support ACID transactions and schema-enforced document collections.

---

## 1. Replica Set Architecture

- **Replica Set Name**: `rs0`
- **Port**: `27017`
- **Host**: `localhost` / `127.0.0.1`
- **Data Path**: `./data/rs0`
- **Database**: `library_db`

### Connecting via mongosh
```bash
mongosh "mongodb://localhost:27017/library_db?replicaSet=rs0"
```
Or simply:
```bash
mongosh --port 27017
```

---

## 2. Collections and Schema Validation Rules

All collections are created in `library_db` with `strict` validation level and `error` validation action using JSON Schema (`$jsonSchema`).

### `users`
Enforces valid user profiles and membership rules.
- **Required fields**: `name`, `email`, `role`, `status`
- **Email Validation**: Validated with regex format pattern.
- **Roles**: `student`, `faculty`, `staff`, `librarian`, `admin`, `member`
- **Status**: `active`, `suspended`, `inactive`, `expired`
- **Indexes**: Unique on `email`, unique on `user_id` (sparse), indexed on `role`, `status`.

### `books`
Enforces catalog metadata.
- **Required fields**: `isbn`, `title`, `authors`, `total_copies`, `available_copies`
- **Authors**: Array of strings with `minItems: 1`.
- **Copies**: Non-negative numeric counts (`minimum: 0`).
- **Indexes**: Unique on `isbn`, compound text index on `title` and `description`, indexed on `authors`, `genres`.

### `book_copies`
Enforces individual physical book inventory tracking.
- **Required fields**: `book_id`, `barcode`, `status`
- **Status**: `available`, `borrowed`, `reserved`, `maintenance`, `lost`, `damaged`
- **Condition**: `new`, `good`, `fair`, `poor`, `damaged`
- **Indexes**: Unique on `barcode`, compound index on `{ book_id: 1, status: 1 }`.

### `borrow_transactions`
Enforces checkout, due date, return date, and renewal lifecycles.
- **Required fields**: `user_id`, `book_id`, `copy_id`, `borrow_date`, `due_date`, `status`
- **Status**: `borrowed`, `returned`, `overdue`, `lost`
- **Counters & Amounts**: `renewal_count >= 0`, `fine_amount >= 0`
- **Indexes**: Compound index on `{ user_id: 1, status: 1 }`, `{ copy_id: 1, status: 1 }`, `due_date`, unique on `transaction_id` (sparse).

### `fines_and_payments`
Enforces financial accountability, overdue penalties, and payment tracking.
- **Required fields**: `user_id`, `amount`, `fine_reason`, `status`
- **Fine Reasons**: `overdue`, `damaged_book`, `lost_book`, `membership_fee`, `replacement`, `other`
- **Status**: `pending`, `paid`, `waived`, `partially_paid`
- **Payment Method**: `cash`, `card`, `upi`, `online`, `net_banking`, `waiver`, `pending`
- **Indexes**: Compound index on `{ user_id: 1, status: 1 }`, `transaction_id`, unique on `fine_id` (sparse).

### `book_requests`
Enforces book reservations, holds, and procurement requests.
- **Required fields**: `user_id`, `title`, `request_type`, `request_date`, `status`
- **Request Type**: `hold`, `reservation`, `procurement`, `renewal`
- **Status**: `pending`, `approved`, `fulfilled`, `rejected`, `cancelled`
- **Priority**: `low`, `medium`, `high`
- **Indexes**: Compound index on `{ user_id: 1, status: 1 }`, `book_id`, `request_date`.

---

## 3. Helper Scripts

- `init_library_db.js`: Initializes and updates all schemas and indexes.
  ```bash
  mongosh --port 27017 init_library_db.js
  ```
- `seed_library_db.js`: Seeds comprehensive, relational-consistent sample data into all 6 collections.
  ```bash
  mongosh --port 27017 seed_library_db.js
  ```
- `run_review2_verification.js`: Comprehensive Review 2 verification suite (Topology, Counts >= 50, Schema Error 121, CRUD, Indexing IXSCAN vs COLLSCAN, ACID Transactions, and Aggregations A1/A3/A5).
  ```bash
  mongosh --port 27017 run_review2_verification.js
  ```
- `crud_demo.js`: Executes and logs basic CRUD operations (Insert user, Find active books, Update user address, Soft-delete book request).
  ```bash
  mongosh --port 27017 crud_demo.js
  ```
- `test_schema_validation.js`: Runs automated test suite verifying valid insertions and rejection of invalid data.
  ```bash
  mongosh --port 27017 test_schema_validation.js
  ```
- `check_referential_integrity.js`: Audits all 13 scalar foreign key references, embedded reservation queue lookups, and denormalized counters to verify 0 orphan records and 100% counter consistency.
  ```bash
  mongosh --port 27017 check_referential_integrity.js
  ```
- `explain_ix06_demo.js`: Generates and compares executionStats for Index IX-06 (IXSCAN) vs Forced Collection Scan (COLLSCAN).
  ```bash
  mongosh --port 27017 explain_ix06_demo.js
  ```

---

## 4. Seeded Data Overview

| Collection | Seeded Count | Sample Highlights |
| :--- | :--- | :--- |
| **`users`** | 18 | Admin (Eleanor Vance), Librarians (Sarah Jenkins, Linda Wu), Faculty (Drs. Turing, Hopper, Shannon), Staff (Marcus Brody), and 11 Students. |
| **`books`** | 6 | CS textbooks: *Database System Concepts*, *DDIA*, *Introduction to Algorithms*, *Clean Code*, *AI: A Modern Approach*, *Computer Networks*. |
| **`book_copies`** | 27 | Physical copies with individual barcodes (`BC-*`), conditions, shelf locations, and statuses (`available`, `borrowed`, `reserved`). |
| **`borrow_transactions`** | 4 | Complete loan lifecycle: 1 returned, 2 active (`borrowed`), 1 `overdue`. |
| **`fines_and_payments`** | 4 | Fine lifecycle: 1 `pending` (overdue), 1 `paid` (via UPI), 1 `partially_paid` (damaged book), 1 `waived` (faculty research waiver). |
| **`book_requests`** | 4 | Request lifecycle: 1 `hold`, 1 `reservation` (approved), 1 `procurement` (new title requested by faculty), 1 `fulfilled`. |
| **Total Documents** | **63** | Exceeds 50 documents across all 6 collections. |

---

## 5. Process Management

### Start MongoDB
```bash
mongod --replSet rs0 --port 27017 --dbpath ./data/rs0 --bind_ip localhost
```

### Stop MongoDB
```bash
mongosh --port 27017 --eval 'db.getSiblingDB("admin").shutdownServer()'
```
