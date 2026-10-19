// Seed script for library_db
// Populates all collections with realistic, relational-consistent sample data

const dbName = 'library_db';
const libraryDb = db.getSiblingDB(dbName);

print(`====================================================`);
print(`Seeding Sample Data for: ${dbName}`);
print(`====================================================`);

// Clear any existing collection data to ensure a clean seed
libraryDb.users.deleteMany({});
libraryDb.books.deleteMany({});
libraryDb.book_copies.deleteMany({});
libraryDb.borrow_transactions.deleteMany({});
libraryDb.fines_and_payments.deleteMany({});
libraryDb.book_requests.deleteMany({});
print(`✓ Cleaned existing documents in all collections.`);

// ----------------------------------------------------
// 1. SEED USERS
// ----------------------------------------------------
const userAdminId = new ObjectId();
const userLibrarianId = new ObjectId();
const userFacultyId = new ObjectId();
const userStudent1Id = new ObjectId();
const userStudent2Id = new ObjectId();
const userStudent3Id = new ObjectId();
const userStudent4Id = new ObjectId();
const userStudent5Id = new ObjectId();
const userStudent6Id = new ObjectId();
const userStudent7Id = new ObjectId();
const userStudent8Id = new ObjectId();
const userStudent9Id = new ObjectId();
const userStudent10Id = new ObjectId();
const userStudent11Id = new ObjectId();
const userFaculty2Id = new ObjectId();
const userFaculty3Id = new ObjectId();
const userStaff1Id = new ObjectId();
const userLibrarian2Id = new ObjectId();

const usersData = [
  {
    _id: userAdminId,
    user_id: "USR-ADM-001",
    name: "Eleanor Vance",
    email: "eleanor.vance@library.edu",
    phone: "+1-555-0101",
    role: "admin",
    status: "active",
    membership_date: new Date("2024-01-01T09:00:00Z"),
    max_books_allowed: 20,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "100 University Ave",
      city: "Cambridge",
      state: "MA",
      postal_code: "02138"
    },
    created_at: new Date("2024-01-01T09:00:00Z"),
    updated_at: new Date("2024-01-01T09:00:00Z")
  },
  {
    _id: userLibrarianId,
    user_id: "USR-LIB-001",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@library.edu",
    phone: "+1-555-0102",
    role: "librarian",
    status: "active",
    membership_date: new Date("2024-01-15T09:00:00Z"),
    max_books_allowed: 15,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "42 Library Way",
      city: "Cambridge",
      state: "MA",
      postal_code: "02138"
    },
    created_at: new Date("2024-01-15T09:00:00Z"),
    updated_at: new Date("2024-01-15T09:00:00Z")
  },
  {
    _id: userFacultyId,
    user_id: "USR-FAC-101",
    name: "Dr. Alan Turing",
    email: "alan.turing@university.edu",
    phone: "+1-555-0201",
    role: "faculty",
    status: "active",
    membership_date: new Date("2024-08-20T10:00:00Z"),
    max_books_allowed: 10,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "77 Computing Lane",
      city: "Cambridge",
      state: "MA",
      postal_code: "02139"
    },
    created_at: new Date("2024-08-20T10:00:00Z"),
    updated_at: new Date("2024-08-20T10:00:00Z")
  },
  {
    _id: userStudent1Id,
    user_id: "USR-STU-501",
    name: "Alice Johnson",
    email: "alice.johnson@student.edu",
    phone: "+1-555-0301",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-01T08:30:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 1,
    total_fines_due: 0,
    address: {
      street: "Dorm 4, Room 210",
      city: "Cambridge",
      state: "MA",
      postal_code: "02138"
    },
    created_at: new Date("2025-09-01T08:30:00Z"),
    updated_at: new Date("2026-09-15T11:00:00Z")
  },
  {
    _id: userStudent2Id,
    user_id: "USR-STU-502",
    name: "Bob Smith",
    email: "bob.smith@student.edu",
    phone: "+1-555-0302",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-01T08:30:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 1,
    total_fines_due: 0,
    address: {
      street: "Dorm 2, Room 105",
      city: "Cambridge",
      state: "MA",
      postal_code: "02138"
    },
    created_at: new Date("2025-09-01T08:30:00Z"),
    updated_at: new Date("2026-09-18T14:30:00Z")
  },
  {
    _id: userStudent3Id,
    user_id: "USR-STU-503",
    name: "Charlie Brown",
    email: "charlie.brown@student.edu",
    phone: "+1-555-0303",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-05T09:15:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 1,
    total_fines_due: 25.00,
    address: {
      street: "12 Pine Street",
      city: "Cambridge",
      state: "MA",
      postal_code: "02140"
    },
    created_at: new Date("2025-09-05T09:15:00Z"),
    updated_at: new Date("2026-09-20T16:00:00Z")
  },
  {
    _id: userStudent4Id,
    user_id: "USR-STU-504",
    name: "Diana Prince",
    email: "diana.prince@student.edu",
    phone: "+1-555-0304",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-10T10:00:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 0,
    total_fines_due: 25.00,
    address: {
      street: "88 Beacon Street",
      city: "Boston",
      state: "MA",
      postal_code: "02108"
    },
    created_at: new Date("2025-09-10T10:00:00Z"),
    updated_at: new Date("2026-09-22T10:00:00Z")
  },
  {
    _id: userStudent5Id,
    user_id: "USR-STU-505",
    name: "Ethan Hunt",
    email: "ethan.hunt@student.edu",
    phone: "+1-555-0305",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-12T10:00:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "55 Mission Way",
      city: "Cambridge",
      state: "MA",
      postal_code: "02138"
    },
    created_at: new Date("2025-09-12T10:00:00Z"),
    updated_at: new Date("2025-09-12T10:00:00Z")
  },
  {
    _id: userStudent6Id,
    user_id: "USR-STU-506",
    name: "Fiona Gallagher",
    email: "fiona.gallagher@student.edu",
    phone: "+1-555-0306",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-14T11:30:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "21 Elm Street",
      city: "Somerville",
      state: "MA",
      postal_code: "02143"
    },
    created_at: new Date("2025-09-14T11:30:00Z"),
    updated_at: new Date("2025-09-14T11:30:00Z")
  },
  {
    _id: userStudent7Id,
    user_id: "USR-STU-507",
    name: "George Clark",
    email: "george.clark@student.edu",
    phone: "+1-555-0307",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-15T09:00:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "7 Oxford Street",
      city: "Cambridge",
      state: "MA",
      postal_code: "02138"
    },
    created_at: new Date("2025-09-15T09:00:00Z"),
    updated_at: new Date("2025-09-15T09:00:00Z")
  },
  {
    _id: userStudent8Id,
    user_id: "USR-STU-508",
    name: "Hannah Abbott",
    email: "hannah.abbott@student.edu",
    phone: "+1-555-0308",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-16T14:00:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "14 Highland Ave",
      city: "Somerville",
      state: "MA",
      postal_code: "02143"
    },
    created_at: new Date("2025-09-16T14:00:00Z"),
    updated_at: new Date("2025-09-16T14:00:00Z")
  },
  {
    _id: userStudent9Id,
    user_id: "USR-STU-509",
    name: "Ian Malcolm",
    email: "ian.malcolm@student.edu",
    phone: "+1-555-0309",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-18T10:00:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "33 Chaos Theory Road",
      city: "Boston",
      state: "MA",
      postal_code: "02215"
    },
    created_at: new Date("2025-09-18T10:00:00Z"),
    updated_at: new Date("2025-09-18T10:00:00Z")
  },
  {
    _id: userStudent10Id,
    user_id: "USR-STU-510",
    name: "Julia Roberts",
    email: "julia.roberts@student.edu",
    phone: "+1-555-0310",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-20T12:00:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "90 Broadway",
      city: "Cambridge",
      state: "MA",
      postal_code: "02139"
    },
    created_at: new Date("2025-09-20T12:00:00Z"),
    updated_at: new Date("2025-09-20T12:00:00Z")
  },
  {
    _id: userStudent11Id,
    user_id: "USR-STU-511",
    name: "Kevin Mitnick",
    email: "kevin.mitnick@student.edu",
    phone: "+1-555-0311",
    role: "student",
    status: "active",
    membership_date: new Date("2025-09-22T15:30:00Z"),
    max_books_allowed: 5,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "101 Cyber Way",
      city: "Boston",
      state: "MA",
      postal_code: "02210"
    },
    created_at: new Date("2025-09-22T15:30:00Z"),
    updated_at: new Date("2025-09-22T15:30:00Z")
  },
  {
    _id: userFaculty2Id,
    user_id: "USR-FAC-102",
    name: "Dr. Grace Hopper",
    email: "grace.hopper@university.edu",
    phone: "+1-555-0202",
    role: "faculty",
    status: "active",
    membership_date: new Date("2024-08-25T09:00:00Z"),
    max_books_allowed: 10,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "1 Nanosecond Court",
      city: "Cambridge",
      state: "MA",
      postal_code: "02138"
    },
    created_at: new Date("2024-08-25T09:00:00Z"),
    updated_at: new Date("2024-08-25T09:00:00Z")
  },
  {
    _id: userFaculty3Id,
    user_id: "USR-FAC-103",
    name: "Dr. Claude Shannon",
    email: "claude.shannon@university.edu",
    phone: "+1-555-0203",
    role: "faculty",
    status: "active",
    membership_date: new Date("2024-09-01T10:00:00Z"),
    max_books_allowed: 10,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "8 Information Drive",
      city: "Cambridge",
      state: "MA",
      postal_code: "02139"
    },
    created_at: new Date("2024-09-01T10:00:00Z"),
    updated_at: new Date("2024-09-01T10:00:00Z")
  },
  {
    _id: userStaff1Id,
    user_id: "USR-STF-301",
    name: "Marcus Brody",
    email: "marcus.brody@university.edu",
    phone: "+1-555-0401",
    role: "staff",
    status: "active",
    membership_date: new Date("2024-05-10T08:00:00Z"),
    max_books_allowed: 8,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "15 Museum Road",
      city: "Boston",
      state: "MA",
      postal_code: "02115"
    },
    created_at: new Date("2024-05-10T08:00:00Z"),
    updated_at: new Date("2024-05-10T08:00:00Z")
  },
  {
    _id: userLibrarian2Id,
    user_id: "USR-LIB-002",
    name: "Linda Wu",
    email: "linda.wu@library.edu",
    phone: "+1-555-0103",
    role: "librarian",
    status: "active",
    membership_date: new Date("2024-03-01T09:00:00Z"),
    max_books_allowed: 15,
    active_borrows_count: 0,
    total_fines_due: 0,
    address: {
      street: "24 Archive Street",
      city: "Cambridge",
      state: "MA",
      postal_code: "02138"
    },
    created_at: new Date("2024-03-01T09:00:00Z"),
    updated_at: new Date("2024-03-01T09:00:00Z")
  }
];

const deptMap = {
  "admin": "Library Administration",
  "librarian": "Library Administration",
  "faculty": "Computer Science & Engineering",
  "staff": "Campus Services"
};
const studentDepts = [
  "Computer Science",
  "Electrical Engineering",
  "Information Technology",
  "Data Science",
  "Software Engineering",
  "Computer Science"
];
usersData.forEach((u, i) => {
  if (!u.department) {
    if (u.role === "student") {
      u.department = studentDepts[i % studentDepts.length];
    } else {
      u.department = deptMap[u.role] || "Academic Affairs";
    }
  }
});

libraryDb.users.insertMany(usersData);
print(`✓ Seeded ${usersData.length} documents in 'users' collection.`);

// ----------------------------------------------------
// 2. SEED BOOKS
// ----------------------------------------------------
const book1Id = new ObjectId();
const book2Id = new ObjectId();
const book3Id = new ObjectId();
const book4Id = new ObjectId();
const book5Id = new ObjectId();
const book6Id = new ObjectId();

const booksData = [
  {
    _id: book1Id,
    isbn: "978-0078022159",
    title: "Database System Concepts",
    authors: ["Abraham Silberschatz", "Henry F. Korth", "S. Sudarshan"],
    publisher: "McGraw-Hill Education",
    publication_year: 2019,
    edition: "7th Edition",
    genres: ["Databases", "Computer Science", "Information Systems"],
    language: "English",
    total_copies: 5,
    available_copies: 3,
    reservation_queue: [
      {
        queue_id: new ObjectId(),
        user_id: userStudent1Id,
        request_date: new Date("2026-09-24T12:00:00Z"),
        priority: "medium",
        status: "pending"
      }
    ],
    shelf_location: "CS-DB-01",
    description: "The fundamental textbook covering relational database theory, SQL, transactions, indexing, and storage engines.",
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2026-09-20T16:00:00Z")
  },
  {
    _id: book2Id,
    isbn: "978-1449373320",
    title: "Designing Data-Intensive Applications",
    authors: ["Martin Kleppmann"],
    publisher: "O'Reilly Media",
    publication_year: 2017,
    edition: "1st Edition",
    genres: ["Distributed Systems", "Databases", "Software Engineering"],
    language: "English",
    total_copies: 5,
    available_copies: 4,
    reservation_queue: [],
    shelf_location: "CS-DIST-02",
    description: "The definitive guide to data models, replication, partitioning, transactions, and stream processing.",
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2026-09-18T14:30:00Z")
  },
  {
    _id: book3Id,
    isbn: "978-0262046305",
    title: "Introduction to Algorithms",
    authors: ["Thomas H. Cormen", "Charles E. Leiserson", "Ronald L. Rivest", "Clifford Stein"],
    publisher: "MIT Press",
    publication_year: 2022,
    edition: "4th Edition",
    genres: ["Algorithms", "Data Structures", "Mathematics"],
    language: "English",
    total_copies: 5,
    available_copies: 4,
    reservation_queue: [],
    shelf_location: "CS-ALGO-01",
    description: "Comprehensive textbook on algorithms, computational complexity, dynamic programming, and graph algorithms.",
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2026-09-15T11:00:00Z")
  },
  {
    _id: book4Id,
    isbn: "978-0132350884",
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    authors: ["Robert C. Martin"],
    publisher: "Prentice Hall",
    publication_year: 2008,
    edition: "1st Edition",
    genres: ["Software Engineering", "Programming", "Best Practices"],
    language: "English",
    total_copies: 4,
    available_copies: 4,
    reservation_queue: [],
    shelf_location: "CS-SE-03",
    description: "A handbook on crafting readable, maintainable, and robust software using modern engineering practices.",
    created_at: new Date("2025-01-12T11:00:00Z"),
    updated_at: new Date("2026-09-10T09:00:00Z")
  },
  {
    _id: book5Id,
    isbn: "978-0134610993",
    title: "Artificial Intelligence: A Modern Approach",
    authors: ["Stuart Russell", "Peter Norvig"],
    publisher: "Pearson",
    publication_year: 2020,
    edition: "4th Edition",
    genres: ["Artificial Intelligence", "Machine Learning", "Computer Science"],
    language: "English",
    total_copies: 4,
    available_copies: 3,
    reservation_queue: [
      {
        queue_id: new ObjectId(),
        user_id: userStudent4Id,
        request_date: new Date("2026-09-22T09:00:00Z"),
        priority: "high",
        status: "approved"
      }
    ],
    shelf_location: "CS-AI-01",
    description: "The leading textbook in Artificial Intelligence covering search, reasoning, probabilistic modeling, and machine learning.",
    created_at: new Date("2025-01-15T14:00:00Z"),
    updated_at: new Date("2026-09-22T10:00:00Z")
  },
  {
    _id: book6Id,
    isbn: "978-0133594140",
    title: "Computer Networks",
    authors: ["Andrew S. Tanenbaum", "David J. Wetherall"],
    publisher: "Pearson",
    publication_year: 2021,
    edition: "6th Edition",
    genres: ["Networking", "Operating Systems", "Telecommunications"],
    language: "English",
    total_copies: 4,
    available_copies: 4,
    reservation_queue: [],
    shelf_location: "CS-NET-01",
    description: "In-depth treatment of networking architectures from the physical layer up to application-level protocols.",
    created_at: new Date("2025-02-01T10:00:00Z"),
    updated_at: new Date("2025-02-01T10:00:00Z")
  }
];

libraryDb.books.insertMany(booksData);
print(`✓ Seeded ${booksData.length} documents in 'books' collection.`);

// ----------------------------------------------------
// 3. SEED BOOK COPIES
// ----------------------------------------------------
const copy1_1 = new ObjectId();
const copy1_2 = new ObjectId();
const copy1_3 = new ObjectId();
const copy1_4 = new ObjectId();
const copy1_5 = new ObjectId();

const copy2_1 = new ObjectId();
const copy2_2 = new ObjectId();
const copy2_3 = new ObjectId();
const copy2_4 = new ObjectId();
const copy2_5 = new ObjectId();

const copy3_1 = new ObjectId();
const copy3_2 = new ObjectId();
const copy3_3 = new ObjectId();
const copy3_4 = new ObjectId();
const copy3_5 = new ObjectId();

const copy4_1 = new ObjectId();
const copy4_2 = new ObjectId();
const copy4_3 = new ObjectId();
const copy4_4 = new ObjectId();

const copy5_1 = new ObjectId();
const copy5_2 = new ObjectId();
const copy5_3 = new ObjectId();
const copy5_4 = new ObjectId();

const copy6_1 = new ObjectId();
const copy6_2 = new ObjectId();
const copy6_3 = new ObjectId();
const copy6_4 = new ObjectId();

const bookCopiesData = [
  // Database System Concepts (Total 3: 1 borrowed, 1 reserved, 1 available)
  {
    _id: copy1_1,
    book_id: book1Id,
    barcode: "BC-DBSC-001",
    copy_number: 1,
    status: "borrowed", // Borrowed by Charlie Brown (overdue)
    condition: "good",
    shelf_location: "CS-DB-01-A",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 89.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2026-09-01T10:00:00Z")
  },
  {
    _id: copy1_2,
    book_id: book1Id,
    barcode: "BC-DBSC-002",
    copy_number: 2,
    status: "reserved", // Reserved for Alice
    condition: "good",
    shelf_location: "CS-DB-01-B",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 89.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2026-09-24T12:00:00Z")
  },
  {
    _id: copy1_3,
    book_id: book1Id,
    barcode: "BC-DBSC-003",
    copy_number: 3,
    status: "available",
    condition: "new",
    shelf_location: "CS-DB-01-C",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 89.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },
  {
    _id: copy1_4,
    book_id: book1Id,
    barcode: "BC-DBSC-004",
    copy_number: 4,
    status: "available",
    condition: "good",
    shelf_location: "CS-DB-01-D",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 89.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },
  {
    _id: copy1_5,
    book_id: book1Id,
    barcode: "BC-DBSC-005",
    copy_number: 5,
    status: "available",
    condition: "new",
    shelf_location: "CS-DB-01-E",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 89.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },

  // Designing Data-Intensive Applications (Total 5: 1 borrowed, 4 available)
  {
    _id: copy2_1,
    book_id: book2Id,
    barcode: "BC-DDIA-001",
    copy_number: 1,
    status: "borrowed", // Borrowed by Bob Smith
    condition: "good",
    shelf_location: "CS-DIST-02-A",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 49.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2026-09-18T14:30:00Z")
  },
  {
    _id: copy2_2,
    book_id: book2Id,
    barcode: "BC-DDIA-002",
    copy_number: 2,
    status: "available",
    condition: "new",
    shelf_location: "CS-DIST-02-B",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 49.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },
  {
    _id: copy2_3,
    book_id: book2Id,
    barcode: "BC-DDIA-003",
    copy_number: 3,
    status: "available",
    condition: "good",
    shelf_location: "CS-DIST-02-C",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 49.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },
  {
    _id: copy2_4,
    book_id: book2Id,
    barcode: "BC-DDIA-004",
    copy_number: 4,
    status: "available",
    condition: "good",
    shelf_location: "CS-DIST-02-D",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 49.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },
  {
    _id: copy2_5,
    book_id: book2Id,
    barcode: "BC-DDIA-005",
    copy_number: 5,
    status: "available",
    condition: "new",
    shelf_location: "CS-DIST-02-E",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 49.99,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },

  // Introduction to Algorithms (Total 5: 1 borrowed, 4 available)
  {
    _id: copy3_1,
    book_id: book3Id,
    barcode: "BC-CLRS-001",
    copy_number: 1,
    status: "borrowed", // Borrowed by Alice Johnson
    condition: "good",
    shelf_location: "CS-ALGO-01-A",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 110.00,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2026-09-15T11:00:00Z")
  },
  {
    _id: copy3_2,
    book_id: book3Id,
    barcode: "BC-CLRS-002",
    copy_number: 2,
    status: "available",
    condition: "good",
    shelf_location: "CS-ALGO-01-B",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 110.00,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },
  {
    _id: copy3_3,
    book_id: book3Id,
    barcode: "BC-CLRS-003",
    copy_number: 3,
    status: "available",
    condition: "new",
    shelf_location: "CS-ALGO-01-C",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 110.00,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },
  {
    _id: copy3_4,
    book_id: book3Id,
    barcode: "BC-CLRS-004",
    copy_number: 4,
    status: "available",
    condition: "good",
    shelf_location: "CS-ALGO-01-D",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 110.00,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },
  {
    _id: copy3_5,
    book_id: book3Id,
    barcode: "BC-CLRS-005",
    copy_number: 5,
    status: "available",
    condition: "new",
    shelf_location: "CS-ALGO-01-E",
    acquired_date: new Date("2025-01-10T10:00:00Z"),
    price: 110.00,
    created_at: new Date("2025-01-10T10:00:00Z"),
    updated_at: new Date("2025-01-10T10:00:00Z")
  },

  // Clean Code (Total 4: 4 available)
  {
    _id: copy4_1,
    book_id: book4Id,
    barcode: "BC-CLN-001",
    copy_number: 1,
    status: "available", // Previously borrowed and returned by Alice
    condition: "good",
    shelf_location: "CS-SE-03-A",
    acquired_date: new Date("2025-01-12T11:00:00Z"),
    price: 45.00,
    created_at: new Date("2025-01-12T11:00:00Z"),
    updated_at: new Date("2026-09-10T09:00:00Z")
  },
  {
    _id: copy4_2,
    book_id: book4Id,
    barcode: "BC-CLN-002",
    copy_number: 2,
    status: "available",
    condition: "fair",
    shelf_location: "CS-SE-03-B",
    acquired_date: new Date("2025-01-12T11:00:00Z"),
    price: 45.00,
    created_at: new Date("2025-01-12T11:00:00Z"),
    updated_at: new Date("2026-09-22T10:00:00Z")
  },
  {
    _id: copy4_3,
    book_id: book4Id,
    barcode: "BC-CLN-003",
    copy_number: 3,
    status: "available",
    condition: "good",
    shelf_location: "CS-SE-03-C",
    acquired_date: new Date("2025-01-12T11:00:00Z"),
    price: 45.00,
    created_at: new Date("2025-01-12T11:00:00Z"),
    updated_at: new Date("2025-01-12T11:00:00Z")
  },
  {
    _id: copy4_4,
    book_id: book4Id,
    barcode: "BC-CLN-004",
    copy_number: 4,
    status: "available",
    condition: "new",
    shelf_location: "CS-SE-03-D",
    acquired_date: new Date("2025-01-12T11:00:00Z"),
    price: 45.00,
    created_at: new Date("2025-01-12T11:00:00Z"),
    updated_at: new Date("2025-01-12T11:00:00Z")
  },

  // Artificial Intelligence: A Modern Approach (Total 4: 1 reserved, 3 available)
  {
    _id: copy5_1,
    book_id: book5Id,
    barcode: "BC-AIMA-001",
    copy_number: 1,
    status: "reserved", // Reserved for Diana
    condition: "good",
    shelf_location: "CS-AI-01-A",
    acquired_date: new Date("2025-01-15T14:00:00Z"),
    price: 125.00,
    created_at: new Date("2025-01-15T14:00:00Z"),
    updated_at: new Date("2026-09-22T10:00:00Z")
  },
  {
    _id: copy5_2,
    book_id: book5Id,
    barcode: "BC-AIMA-002",
    copy_number: 2,
    status: "available",
    condition: "new",
    shelf_location: "CS-AI-01-B",
    acquired_date: new Date("2025-01-15T14:00:00Z"),
    price: 125.00,
    created_at: new Date("2025-01-15T14:00:00Z"),
    updated_at: new Date("2025-01-15T14:00:00Z")
  },
  {
    _id: copy5_3,
    book_id: book5Id,
    barcode: "BC-AIMA-003",
    copy_number: 3,
    status: "available",
    condition: "good",
    shelf_location: "CS-AI-01-C",
    acquired_date: new Date("2025-01-15T14:00:00Z"),
    price: 125.00,
    created_at: new Date("2025-01-15T14:00:00Z"),
    updated_at: new Date("2025-01-15T14:00:00Z")
  },
  {
    _id: copy5_4,
    book_id: book5Id,
    barcode: "BC-AIMA-004",
    copy_number: 4,
    status: "available",
    condition: "new",
    shelf_location: "CS-AI-01-D",
    acquired_date: new Date("2025-01-15T14:00:00Z"),
    price: 125.00,
    created_at: new Date("2025-01-15T14:00:00Z"),
    updated_at: new Date("2025-01-15T14:00:00Z")
  },

  // Computer Networks (Total 4: 4 available)
  {
    _id: copy6_1,
    book_id: book6Id,
    barcode: "BC-NET-001",
    copy_number: 1,
    status: "available",
    condition: "good",
    shelf_location: "CS-NET-01-A",
    acquired_date: new Date("2025-02-01T10:00:00Z"),
    price: 95.00,
    created_at: new Date("2025-02-01T10:00:00Z"),
    updated_at: new Date("2025-02-01T10:00:00Z")
  },
  {
    _id: copy6_2,
    book_id: book6Id,
    barcode: "BC-NET-002",
    copy_number: 2,
    status: "available",
    condition: "new",
    shelf_location: "CS-NET-01-B",
    acquired_date: new Date("2025-02-01T10:00:00Z"),
    price: 95.00,
    created_at: new Date("2025-02-01T10:00:00Z"),
    updated_at: new Date("2025-02-01T10:00:00Z")
  },
  {
    _id: copy6_3,
    book_id: book6Id,
    barcode: "BC-NET-003",
    copy_number: 3,
    status: "available",
    condition: "good",
    shelf_location: "CS-NET-01-C",
    acquired_date: new Date("2025-02-01T10:00:00Z"),
    price: 95.00,
    created_at: new Date("2025-02-01T10:00:00Z"),
    updated_at: new Date("2025-02-01T10:00:00Z")
  },
  {
    _id: copy6_4,
    book_id: book6Id,
    barcode: "BC-NET-004",
    copy_number: 4,
    status: "available",
    condition: "new",
    shelf_location: "CS-NET-01-D",
    acquired_date: new Date("2025-02-01T10:00:00Z"),
    price: 95.00,
    created_at: new Date("2025-02-01T10:00:00Z"),
    updated_at: new Date("2025-02-01T10:00:00Z")
  }
];

bookCopiesData.forEach(copy => {
  if (!copy.bookId) copy.bookId = copy.book_id;
  if (!copy.branch) copy.branch = "Main Campus - Central Library";
  if (copy.status === "available") copy.status = "AVAILABLE";
  if (copy.status === "borrowed") copy.status = "BORROWED";
  if (copy.status === "reserved") copy.status = "RESERVED";
});

libraryDb.book_copies.insertMany(bookCopiesData);
print(`✓ Seeded ${bookCopiesData.length} documents in 'book_copies' collection.`);

// ----------------------------------------------------
// 4. SEED BORROW TRANSACTIONS
// ----------------------------------------------------
const txn1Id = new ObjectId(); // Returned
const txn2Id = new ObjectId(); // Active (DDIA)
const txn3Id = new ObjectId(); // Overdue (DBSC)
const txn4Id = new ObjectId(); // Active (CLRS)

const borrowTransactionsData = [
  {
    _id: txn1Id,
    transaction_id: "TXN-2026-0801",
    user_id: userStudent1Id,
    book_id: book4Id,
    copy_id: copy4_1,
    borrow_date: new Date("2026-08-20T10:30:00Z"),
    due_date: new Date("2026-09-03T10:30:00Z"),
    return_date: new Date("2026-09-01T15:45:00Z"),
    status: "returned",
    renewal_count: 0,
    fine_amount: 0,
    issued_by: userLibrarianId,
    returned_to: userLibrarianId,
    notes: "Returned on time in pristine condition.",
    created_at: new Date("2026-08-20T10:30:00Z"),
    updated_at: new Date("2026-09-01T15:45:00Z")
  },
  {
    _id: txn2Id,
    transaction_id: "TXN-2026-0902",
    user_id: userStudent2Id,
    book_id: book2Id,
    copy_id: copy2_1,
    borrow_date: new Date("2026-09-18T14:30:00Z"),
    due_date: new Date("2026-10-02T14:30:00Z"),
    return_date: null,
    status: "borrowed",
    renewal_count: 0,
    fine_amount: 0,
    issued_by: userLibrarianId,
    notes: "Active loan, due next month.",
    created_at: new Date("2026-09-18T14:30:00Z"),
    updated_at: new Date("2026-09-18T14:30:00Z")
  },
  {
    _id: txn3Id,
    transaction_id: "TXN-2026-0903",
    user_id: userStudent3Id,
    book_id: book1Id,
    copy_id: copy1_1,
    borrow_date: new Date("2026-09-01T10:00:00Z"),
    due_date: new Date("2026-09-15T10:00:00Z"), // Overdue!
    return_date: null,
    status: "overdue",
    renewal_count: 0,
    fine_amount: 25.00,
    issued_by: userLibrarianId,
    notes: "Overdue by 10 days ($2.50/day fine assessed).",
    created_at: new Date("2026-09-01T10:00:00Z"),
    updated_at: new Date("2026-09-25T10:00:00Z")
  },
  {
    _id: txn4Id,
    transaction_id: "TXN-2026-0904",
    user_id: userStudent1Id,
    book_id: book3Id,
    copy_id: copy3_1,
    borrow_date: new Date("2026-09-15T11:00:00Z"),
    due_date: new Date("2026-09-29T11:00:00Z"),
    return_date: null,
    status: "borrowed",
    renewal_count: 0,
    fine_amount: 0,
    issued_by: userLibrarianId,
    notes: "Active loan for Algorithms assignment.",
    created_at: new Date("2026-09-15T11:00:00Z"),
    updated_at: new Date("2026-09-15T11:00:00Z")
  }
];

libraryDb.borrow_transactions.insertMany(borrowTransactionsData);
print(`✓ Seeded ${borrowTransactionsData.length} documents in 'borrow_transactions' collection.`);

// ----------------------------------------------------
// 5. SEED FINES AND PAYMENTS
// ----------------------------------------------------
const fine1Id = new ObjectId();
const fine2Id = new ObjectId();
const fine3Id = new ObjectId();
const fine4Id = new ObjectId();

const finesAndPaymentsData = [
  // 1. Unpaid overdue fine for Charlie Brown (linked to txn3)
  {
    _id: fine1Id,
    fine_id: "FINE-2026-001",
    transaction_id: txn3Id,
    user_id: userStudent3Id,
    amount: 25.00,
    fine_reason: "overdue",
    status: "pending",
    amount_paid: 0,
    issued_date: new Date("2026-09-16T00:00:00Z"),
    paid_date: null,
    payment_method: "pending",
    processed_by: userLibrarianId,
    remarks: "10 days overdue on Database System Concepts.",
    created_at: new Date("2026-09-16T00:00:00Z"),
    updated_at: new Date("2026-09-25T10:00:00Z")
  },
  // 2. Paid overdue fine for Bob Smith
  {
    _id: fine2Id,
    fine_id: "FINE-2026-002",
    transaction_id: null,
    user_id: userStudent2Id,
    amount: 10.00,
    fine_reason: "overdue",
    status: "paid",
    amount_paid: 10.00,
    issued_date: new Date("2026-09-10T14:00:00Z"),
    paid_date: new Date("2026-09-11T16:20:00Z"),
    payment_method: "upi",
    receipt_number: "REC-2026-089",
    processed_by: userLibrarianId,
    remarks: "Late return fee paid via UPI scanner at front desk.",
    created_at: new Date("2026-09-10T14:00:00Z"),
    updated_at: new Date("2026-09-11T16:20:00Z")
  },
  // 3. Partially paid damaged book fine for Diana Prince
  {
    _id: fine3Id,
    fine_id: "FINE-2026-003",
    transaction_id: null,
    user_id: userStudent4Id,
    amount: 50.00,
    fine_reason: "damaged_book",
    status: "partially_paid",
    amount_paid: 25.00,
    issued_date: new Date("2026-09-15T09:30:00Z"),
    paid_date: new Date("2026-09-15T10:00:00Z"),
    payment_method: "card",
    receipt_number: "REC-2026-112",
    processed_by: userLibrarianId,
    remarks: "Water damage on book cover. $25 paid via debit card, balance $25 pending.",
    created_at: new Date("2026-09-15T09:30:00Z"),
    updated_at: new Date("2026-09-15T10:00:00Z")
  },
  // 4. Waived fee for faculty member Dr. Alan Turing
  {
    _id: fine4Id,
    fine_id: "FINE-2026-004",
    transaction_id: null,
    user_id: userFacultyId,
    amount: 15.00,
    fine_reason: "overdue",
    status: "waived",
    amount_paid: 0,
    issued_date: new Date("2026-08-30T11:00:00Z"),
    paid_date: new Date("2026-09-02T10:00:00Z"),
    payment_method: "waiver",
    processed_by: userAdminId,
    remarks: "Faculty research project extension - fine waived by Dean of Libraries.",
    created_at: new Date("2026-08-30T11:00:00Z"),
    updated_at: new Date("2026-09-02T10:00:00Z")
  }
];

libraryDb.fines_and_payments.insertMany(finesAndPaymentsData);
print(`✓ Seeded ${finesAndPaymentsData.length} documents in 'fines_and_payments' collection.`);

// ----------------------------------------------------
// 6. SEED BOOK REQUESTS
// ----------------------------------------------------
const req1Id = new ObjectId();
const req2Id = new ObjectId();
const req3Id = new ObjectId();
const req4Id = new ObjectId();

const bookRequestsData = [
  // 1. Hold on Database System Concepts by Alice
  {
    _id: req1Id,
    request_id: "REQ-2026-101",
    user_id: userStudent1Id,
    book_id: book1Id,
    title: "Database System Concepts",
    author: "Abraham Silberschatz",
    isbn: "978-0078022159",
    request_type: "hold",
    request_date: new Date("2026-09-24T12:00:00Z"),
    status: "pending",
    priority: "medium",
    comments: "Requesting hold when Charlie's overdue copy is returned or reserved copy becomes available.",
    created_at: new Date("2026-09-24T12:00:00Z"),
    updated_at: new Date("2026-09-24T12:00:00Z")
  },
  // 2. Approved reservation on AI: A Modern Approach by Diana
  {
    _id: req2Id,
    request_id: "REQ-2026-102",
    user_id: userStudent4Id,
    book_id: book5Id,
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell, Peter Norvig",
    isbn: "978-0134610993",
    request_type: "reservation",
    request_date: new Date("2026-09-22T09:00:00Z"),
    status: "approved",
    priority: "high",
    expiry_date: new Date("2026-09-29T23:59:59Z"),
    reviewed_by: userLibrarianId,
    comments: "Reservation approved. Copy BC-AIMA-001 placed on the hold shelf until Sept 29.",
    created_at: new Date("2026-09-22T09:00:00Z"),
    updated_at: new Date("2026-09-22T10:00:00Z")
  },
  // 3. Procurement request for a book not yet in library catalog by Faculty
  {
    _id: req3Id,
    request_id: "REQ-2026-103",
    user_id: userFacultyId,
    book_id: null,
    title: "Quantum Computing for Everyone",
    author: "Chris Bernhardt",
    isbn: "978-0262539531",
    request_type: "procurement",
    request_date: new Date("2026-09-10T14:15:00Z"),
    status: "pending",
    priority: "high",
    comments: "Recommended textbook addition for upcoming Quantum Computing elective course in Spring 2027.",
    created_at: new Date("2026-09-10T14:15:00Z"),
    updated_at: new Date("2026-09-10T14:15:00Z")
  },
  // 4. Fulfilled request by Bob Smith
  {
    _id: req4Id,
    request_id: "REQ-2026-104",
    user_id: userStudent2Id,
    book_id: book2Id,
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    isbn: "978-1449373320",
    request_type: "reservation",
    request_date: new Date("2026-09-16T11:00:00Z"),
    status: "fulfilled",
    fulfilled_date: new Date("2026-09-18T14:30:00Z"),
    reviewed_by: userLibrarianId,
    comments: "Fulfilled via checkout transaction TXN-2026-0902.",
    created_at: new Date("2026-09-16T11:00:00Z"),
    updated_at: new Date("2026-09-18T14:30:00Z")
  }
];

libraryDb.book_requests.insertMany(bookRequestsData);
print(`✓ Seeded ${bookRequestsData.length} documents in 'book_requests' collection.`);

print(`\n====================================================`);
print(`Verification Summary of Seeded Data in ${dbName}:`);
print(`====================================================`);
const usersCount = libraryDb.users.countDocuments();
const booksCount = libraryDb.books.countDocuments();
const copiesCount = libraryDb.book_copies.countDocuments();
const txnCount = libraryDb.borrow_transactions.countDocuments();
const finesCount = libraryDb.fines_and_payments.countDocuments();
const reqCount = libraryDb.book_requests.countDocuments();
const totalDocs = usersCount + booksCount + copiesCount + txnCount + finesCount + reqCount;

print(`- users:               ${usersCount} documents`);
print(`- books:               ${booksCount} documents`);
print(`- book_copies:         ${copiesCount} documents`);
print(`- borrow_transactions: ${txnCount} documents`);
print(`- fines_and_payments:  ${finesCount} documents`);
print(`- book_requests:       ${reqCount} documents`);
print(`----------------------------------------------------`);
print(`- TOTAL DOCUMENTS:     ${totalDocs} documents (> 50)`);
print(`====================================================`);
print(`Database seeding completed successfully!`);
