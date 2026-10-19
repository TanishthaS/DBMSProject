const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_db?replicaSet=rs0&directConnection=true';
const DB_NAME = 'library_db';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let client;
let db;

async function connectToMongo() {
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`[MongoDB] Connected to database: ${DB_NAME}`);
  } catch (err) {
    console.error(`[MongoDB] Connection error:`, err);
    process.exit(1);
  }
}

// Helper: safe ObjectId converter
function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & REGISTRATION
// -------------------------------------------------------------

// Log In
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!role || !role.trim()) {
      return res.status(400).json({ error: 'Please choose what type of user you are (Student, Faculty, or Librarian).' });
    }

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Please enter your Registration No, User ID, or Email.' });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    const trimmed = identifier.trim();
    const chosenRole = role.trim().toLowerCase();

    // Query user by identifier
    const user = await db.collection('users').findOne({
      $or: [
        { user_id: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
        { email: { $regex: new RegExp(`^${trimmed}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(404).json({
        error: `No account found with identifier '${trimmed}'. Please verify your credentials or sign up.`
      });
    }

    // Strict role verification
    if (user.role.toLowerCase() !== chosenRole) {
      return res.status(400).json({
        error: `Account '${trimmed}' is registered as a ${user.role.toUpperCase()}, not as a ${chosenRole.toUpperCase()}. Please select the correct user type.`
      });
    }

    // Password verification
    if (user.password && user.password !== password.trim()) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // If legacy record had no password, set it now
    if (!user.password) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { password: password.trim(), updated_at: new Date() } }
      );
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: `Account status is '${user.status}'. Please contact the librarian.` });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || 'General',
        max_books_allowed: user.max_books_allowed || (user.role === 'faculty' ? 10 : user.role === 'librarian' ? 15 : 5),
        active_borrows_count: user.active_borrows_count || 0,
        total_fines_due: user.total_fines_due || 0
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, user_id, password, role, department, phone, address } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email address is required.' });
    if (!user_id || !user_id.trim()) return res.status(400).json({ error: 'Registration No / User ID is required.' });
    if (!password || !password.trim()) return res.status(400).json({ error: 'Password is required.' });

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email format. E.g. name@university.edu or student@vitstudent.ac.in' });
    }

    const validRoles = ['student', 'faculty', 'librarian'];
    const chosenRole = validRoles.includes(role?.toLowerCase()) ? role.toLowerCase() : 'student';

    const existingUser = await db.collection('users').findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { user_id: user_id.trim() }
      ]
    });

    if (existingUser) {
      if (existingUser.user_id.toLowerCase() === user_id.trim().toLowerCase()) {
        return res.status(409).json({ error: `An account with Registration No / User ID '${user_id}' already exists.` });
      }
      return res.status(409).json({ error: `An account with email '${email}' already exists.` });
    }

    const maxBooks = chosenRole === 'faculty' ? 10 : (chosenRole === 'librarian' ? 15 : 5);

    const newUserDoc = {
      _id: new ObjectId(),
      user_id: user_id.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      phone: phone?.trim() || '+91-9876543210',
      role: chosenRole,
      status: 'active',
      department: department?.trim() || 'Computer Science & Engineering',
      membership_date: new Date(),
      max_books_allowed: maxBooks,
      active_borrows_count: 0,
      total_fines_due: 0,
      address: {
        street: address?.street || 'Campus Residence',
        city: address?.city || 'Vellore',
        state: address?.state || 'Tamil Nadu',
        postal_code: address?.postal_code || '632014'
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('users').insertOne(newUserDoc);

    res.status(201).json({
      success: true,
      message: 'Account created successfully in database.',
      user: {
        _id: newUserDoc._id,
        user_id: newUserDoc.user_id,
        name: newUserDoc.name,
        email: newUserDoc.email,
        role: newUserDoc.role,
        department: newUserDoc.department,
        max_books_allowed: newUserDoc.max_books_allowed,
        active_borrows_count: newUserDoc.active_borrows_count,
        total_fines_due: newUserDoc.total_fines_due
      }
    });
  } catch (err) {
    console.error('Sign up error:', err);
    res.status(500).json({ error: err.message || 'Error creating user in MongoDB.' });
  }
});

// Get User Profile
app.get('/api/auth/profile/:id', async (req, res) => {
  try {
    const oId = toObjectId(req.params.id);
    if (!oId) return res.status(400).json({ error: 'Invalid user ID' });

    const user = await db.collection('users').findOne({ _id: oId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Recalculate live active borrows count
    const activeCount = await db.collection('borrow_transactions').countDocuments({
      user_id: oId,
      status: { $in: ['borrowed', 'overdue', 'BORROWED', 'OVERDUE'] }
    });

    // Recalculate unpaid fines
    const pendingFines = await db.collection('fines_and_payments').aggregate([
      { $match: { user_id: oId, status: { $in: ['pending', 'partially_paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, paid: { $sum: '$amount_paid' } } }
    ]).toArray();

    const totalUnpaid = pendingFines.length > 0
      ? Math.max(0, (pendingFines[0].total || 0) - (pendingFines[0].paid || 0))
      : (user.total_fines_due || 0);

    // Sync counters back to user doc
    await db.collection('users').updateOne(
      { _id: oId },
      { $set: { active_borrows_count: activeCount, total_fines_due: totalUnpaid, updated_at: new Date() } }
    );

    res.json({
      _id: user._id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || 'General',
      max_books_allowed: user.max_books_allowed || (user.role === 'faculty' ? 10 : 5),
      active_borrows_count: activeCount,
      total_fines_due: totalUnpaid
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// -------------------------------------------------------------
// 2. STUDENT & FACULTY DASHBOARD & TRANSACTIONS
// -------------------------------------------------------------

app.get('/api/student/dashboard/:userId', async (req, res) => {
  try {
    const uId = toObjectId(req.params.userId);
    if (!uId) return res.status(400).json({ error: 'Invalid user ID.' });

    const user = await db.collection('users').findOne({ _id: uId });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // 1. Fetch all active borrow transactions for this user
    const transactions = await db.collection('borrow_transactions').aggregate([
      {
        $match: {
          user_id: uId,
          status: { $in: ['borrowed', 'overdue', 'BORROWED', 'OVERDUE'] }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: 'book_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      {
        $lookup: {
          from: 'book_copies',
          localField: 'copy_id',
          foreignField: '_id',
          as: 'copy'
        }
      },
      {
        $lookup: {
          from: 'fines_and_payments',
          let: { txnId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$transaction_id', '$$txnId'] },
                    { $in: ['$status', ['pending', 'partially_paid']] }
                  ]
                }
              }
            }
          ],
          as: 'pendingFine'
        }
      },
      { $sort: { borrow_date: -1 } }
    ]).toArray();

    const now = new Date();
    let totalFineSum = 0;

    const issuedBooks = transactions.map(txn => {
      const book = txn.book && txn.book[0] ? txn.book[0] : (txn.book_snapshot || { title: 'Unknown Book', isbn: 'N/A' });
      const copy = txn.copy && txn.copy[0] ? txn.copy[0] : { barcode: txn.book_snapshot?.barcode || 'N/A' };
      const dueDate = new Date(txn.due_date);
      const isOverdue = now > dueDate;
      const overdueDays = isOverdue ? Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)) : 0;

      // Fine determination: either from fine doc or txn.fine_amount or 5 INR per day
      let bookFine = 0;
      let fineDocId = null;
      if (txn.pendingFine && txn.pendingFine.length > 0) {
        const f = txn.pendingFine[0];
        bookFine = Math.max(0, (f.amount || 0) - (f.amount_paid || 0));
        fineDocId = f._id;
      } else if (txn.fine_amount && txn.fine_amount > 0) {
        bookFine = txn.fine_amount;
      } else if (isOverdue && overdueDays > 0) {
        bookFine = overdueDays * 5; // standard fine rate
      }

      totalFineSum += bookFine;

      const renewalCount = txn.renewal_count || 0;
      const canRenew = renewalCount < 3;
      const canPayFine = bookFine > 0;

      return {
        _id: txn._id,
        transaction_id: txn.transaction_id || txn._id.toString(),
        book_id: txn.book_id,
        book_title: book.title || 'Untitled Book',
        isbn: book.isbn || 'N/A',
        authors: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown'),
        barcode: copy.barcode || 'N/A',
        borrow_date: txn.borrow_date,
        due_date: txn.due_date,
        status: txn.status.toLowerCase(),
        is_overdue: isOverdue,
        overdue_days: overdueDays,
        renewal_count: renewalCount,
        fine_amount: bookFine,
        fine_doc_id: fineDocId,
        can_renew: canRenew,
        can_pay_fine: canPayFine
      };
    });

    const maxAllowed = user.max_books_allowed || (user.role === 'faculty' ? 10 : 5);
    const booksIssuedCount = issuedBooks.length;
    const canIssueMore = Math.max(0, maxAllowed - booksIssuedCount);

    // Sync with users collection
    await db.collection('users').updateOne(
      { _id: uId },
      { $set: { active_borrows_count: booksIssuedCount, total_fines_due: totalFineSum, updated_at: new Date() } }
    );

    res.json({
      user: {
        _id: user._id,
        user_id: user.user_id,
        name: user.name,
        role: user.role,
        department: user.department
      },
      stats: {
        books_issued: booksIssuedCount,
        max_allowed: maxAllowed,
        can_issue_more: canIssueMore,
        total_fine: totalFineSum
      },
      issued_books: issuedBooks
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve student dashboard data.' });
  }
});

// Renew Book
app.post('/api/student/renew', async (req, res) => {
  try {
    const { transaction_id, user_id } = req.body;
    const tId = toObjectId(transaction_id);
    const uId = toObjectId(user_id);

    if (!tId || !uId) return res.status(400).json({ error: 'Invalid transaction ID or user ID.' });

    const txn = await db.collection('borrow_transactions').findOne({ _id: tId, user_id: uId });
    if (!txn) return res.status(404).json({ error: 'Active borrow transaction not found.' });

    if (txn.status === 'returned' || txn.status === 'RETURNED') {
      return res.status(400).json({ error: 'This book has already been returned and cannot be renewed.' });
    }

    const currentRenewals = txn.renewal_count || 0;
    if (currentRenewals >= 3) {
      return res.status(400).json({ error: 'Maximum renewal limit of 3 renewals reached for this book.' });
    }

    // Extend due date by 14 days from current due date (or now, whichever is later)
    const baseDate = new Date(txn.due_date) > new Date() ? new Date(txn.due_date) : new Date();
    const newDueDate = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    await db.collection('borrow_transactions').updateOne(
      { _id: tId },
      {
        $inc: { renewal_count: 1 },
        $set: {
          due_date: newDueDate,
          status: 'borrowed',
          notes: `Renewed on ${new Date().toISOString().split('T')[0]}. Renewal count: ${currentRenewals + 1}`,
          updated_at: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `Book successfully renewed! New due date is ${newDueDate.toLocaleDateString()}.`,
      renewal_count: currentRenewals + 1,
      new_due_date: newDueDate
    });
  } catch (err) {
    console.error('Renew error:', err);
    res.status(500).json({ error: err.message || 'Failed to renew book.' });
  }
});

// Pay Fine
app.post('/api/student/pay-fine', async (req, res) => {
  try {
    const { transaction_id, user_id, amount, payment_method } = req.body;
    const tId = toObjectId(transaction_id);
    const uId = toObjectId(user_id);

    if (!tId || !uId) return res.status(400).json({ error: 'Invalid transaction or user ID.' });

    const payAmount = Number(amount) || 0;
    if (payAmount <= 0) return res.status(400).json({ error: 'Fine amount must be greater than zero.' });

    // 1. Look for existing pending fine in fines_and_payments
    const existingFine = await db.collection('fines_and_payments').findOne({
      user_id: uId,
      transaction_id: tId,
      status: { $in: ['pending', 'partially_paid'] }
    });

    if (existingFine) {
      await db.collection('fines_and_payments').updateOne(
        { _id: existingFine._id },
        {
          $set: {
            status: 'paid',
            amount_paid: existingFine.amount,
            paid_date: new Date(),
            payment_method: payment_method || 'online',
            receipt_number: `RCP-PAY-${Date.now()}`,
            updated_at: new Date()
          }
        }
      );
    } else {
      // Create new paid receipt document
      await db.collection('fines_and_payments').insertOne({
        _id: new ObjectId(),
        fine_id: `FINE-${Date.now()}`,
        transaction_id: tId,
        user_id: uId,
        amount: payAmount,
        amount_paid: payAmount,
        fine_reason: 'overdue',
        status: 'paid',
        issued_date: new Date(),
        paid_date: new Date(),
        payment_method: payment_method || 'online',
        receipt_number: `RCP-PAY-${Date.now()}`,
        remarks: 'Fine settled online by patron.',
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // 2. Reset fine on transaction
    await db.collection('borrow_transactions').updateOne(
      { _id: tId },
      { $set: { fine_amount: 0, updated_at: new Date() } }
    );

    // 3. Recalculate user's total fines due
    const pendingFines = await db.collection('fines_and_payments').aggregate([
      { $match: { user_id: uId, status: { $in: ['pending', 'partially_paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, paid: { $sum: '$amount_paid' } } }
    ]).toArray();

    const newTotalFines = pendingFines.length > 0
      ? Math.max(0, (pendingFines[0].total || 0) - (pendingFines[0].paid || 0))
      : 0;

    await db.collection('users').updateOne(
      { _id: uId },
      { $set: { total_fines_due: newTotalFines, updated_at: new Date() } }
    );

    res.json({
      success: true,
      message: `Fine of ₹${payAmount} settled successfully. Receipt generated.`,
      new_total_fines: newTotalFines
    });
  } catch (err) {
    console.error('Pay fine error:', err);
    res.status(500).json({ error: err.message || 'Failed to process fine payment.' });
  }
});

// -------------------------------------------------------------
// 3. BOOK CATALOG & ISSUE ACTIONS
// -------------------------------------------------------------

// List books with search, filter, and sorting
app.get('/api/books', async (req, res) => {
  try {
    const { search, author, publisher, isbn, available_only, sort } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { isbn: { $regex: term, $options: 'i' } },
        { publisher: { $regex: term, $options: 'i' } },
        { authors: { $regex: term, $options: 'i' } }
      ];
    }

    if (author && author.trim()) {
      filter.authors = { $regex: author.trim(), $options: 'i' };
    }

    if (publisher && publisher.trim()) {
      filter.publisher = { $regex: publisher.trim(), $options: 'i' };
    }

    if (isbn && isbn.trim()) {
      filter.isbn = { $regex: isbn.trim(), $options: 'i' };
    }

    if (available_only === 'true') {
      filter.available_copies = { $gt: 0 };
    }

    let sortOption = { title: 1 };
    if (sort === 'name_asc') {
      sortOption = { title: 1 };
    } else if (sort === 'name_desc') {
      sortOption = { title: -1 };
    } else if (sort === 'available') {
      sortOption = { available_copies: -1, title: 1 };
    }

    const books = await db.collection('books').find(filter).sort(sortOption).toArray();

    res.json({
      count: books.length,
      books: books.map(b => ({
        _id: b._id,
        isbn: b.isbn,
        title: b.title,
        authors: Array.isArray(b.authors) ? b.authors : [b.authors || 'Unknown'],
        publisher: b.publisher || 'Academic Press',
        publication_year: b.publication_year || 'N/A',
        edition: b.edition || 'Standard Edition',
        genres: b.genres || [],
        total_copies: b.total_copies || 0,
        available_copies: b.available_copies || 0,
        shelf_location: b.shelf_location || 'General Stacks',
        description: b.description || ''
      }))
    });
  } catch (err) {
    console.error('Books list error:', err);
    res.status(500).json({ error: 'Failed to retrieve books catalog.' });
  }
});

// Issue a book to a user (with multi-document ACID transaction)
app.post('/api/books/issue', async (req, res) => {
  const { book_id, user_id } = req.body;
  const bId = toObjectId(book_id);
  const uId = toObjectId(user_id);

  if (!bId || !uId) {
    return res.status(400).json({ error: 'Invalid book ID or user ID.' });
  }

  const session = client.startSession();
  try {
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' }
    });

    // 1. Verify user eligibility
    const user = await db.collection('users').findOne({ _id: uId }, { session });
    if (!user) throw new Error('User record not found.');

    const maxAllowed = user.max_books_allowed || (user.role === 'faculty' ? 10 : 5);
    const activeBorrows = user.active_borrows_count || 0;
    if (activeBorrows >= maxAllowed) {
      throw new Error(`Borrow limit reached. You currently have ${activeBorrows} of ${maxAllowed} books issued.`);
    }

    // 2. Check book availability
    const book = await db.collection('books').findOne({ _id: bId }, { session });
    if (!book) throw new Error('Book not found in catalog.');
    if (!book.available_copies || book.available_copies <= 0) {
      throw new Error(`No available copies of "${book.title}" in stock at this time.`);
    }

    // 3. Locate an available physical copy
    const copy = await db.collection('book_copies').findOne({
      $or: [{ book_id: bId }, { bookId: bId }],
      status: { $in: ['available', 'AVAILABLE'] }
    }, { session });

    if (!copy) {
      throw new Error('All physical copies of this book are currently checked out.');
    }

    // 4. Execute atomic updates across collections
    // A. Decrement available copies in book
    await db.collection('books').updateOne(
      { _id: bId },
      { $inc: { available_copies: -1 }, $set: { updated_at: new Date() } },
      { session }
    );

    // B. Mark physical copy as borrowed
    await db.collection('book_copies').updateOne(
      { _id: copy._id },
      { $set: { status: 'borrowed', updated_at: new Date() } },
      { session }
    );

    // C. Increment user's active_borrows_count
    await db.collection('users').updateOne(
      { _id: uId },
      { $inc: { active_borrows_count: 1 }, $set: { updated_at: new Date() } },
      { session }
    );

    // D. Create borrow transaction document
    const loanDays = user.role === 'faculty' ? 30 : 14;
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + loanDays * 24 * 60 * 60 * 1000);
    const txnCode = `TXN-${Date.now()}`;

    const newTxn = {
      _id: new ObjectId(),
      transaction_id: txnCode,
      user_id: uId,
      book_id: bId,
      copy_id: copy._id,
      borrow_date: borrowDate,
      due_date: dueDate,
      return_date: null,
      status: 'borrowed',
      renewal_count: 0,
      fine_amount: 0,
      book_snapshot: {
        title: book.title,
        isbn: book.isbn,
        barcode: copy.barcode
      },
      notes: `Issued via Online Portal. Loan period: ${loanDays} days.`,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('borrow_transactions').insertOne(newTxn, { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: `"${book.title}" successfully issued! Due date: ${dueDate.toLocaleDateString()}.`,
      transaction_id: txnCode,
      due_date: dueDate,
      barcode: copy.barcode,
      available_copies: book.available_copies - 1,
      active_borrows_count: activeBorrows + 1
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Issue book transaction error:', err);
    res.status(400).json({ error: err.message || 'Failed to issue book.' });
  } finally {
    await session.endSession();
  }
});

// -------------------------------------------------------------
// 4. BOOK REQUESTS
// -------------------------------------------------------------

// Submit a new book request
app.post('/api/requests/create', async (req, res) => {
  try {
    const { user_id, title, author, isbn, publisher, year, version, request_type, priority, comments } = req.body;
    const uId = toObjectId(user_id);

    if (!uId) return res.status(400).json({ error: 'Valid user ID is required.' });
    if (!title || !title.trim()) return res.status(400).json({ error: 'Book title is required.' });
    if (!author || !author.trim()) return res.status(400).json({ error: 'Author is required.' });

    const user = await db.collection('users').findOne({ _id: uId });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Look if book already exists in catalog
    const existingBook = await db.collection('books').findOne({
      $or: [
        { title: { $regex: `^${title.trim()}$`, $options: 'i' } },
        ...(isbn && isbn.trim() ? [{ isbn: isbn.trim() }] : [])
      ]
    });

    const validReqTypes = ['procurement', 'hold', 'reservation', 'renewal'];
    const finalType = validReqTypes.includes(request_type?.toLowerCase()) ? request_type.toLowerCase() : 'procurement';

    const validPriorities = ['low', 'medium', 'high'];
    const finalPriority = validPriorities.includes(priority?.toLowerCase()) ? priority.toLowerCase() : 'medium';

    const detailsStr = [
      publisher ? `Publisher: ${publisher.trim()}` : null,
      year ? `Year: ${year}` : null,
      version ? `Edition/Version: ${version.trim()}` : null,
      comments ? `Notes: ${comments.trim()}` : null
    ].filter(Boolean).join(' | ') || 'Standard patron book request';

    const newRequestDoc = {
      _id: new ObjectId(),
      request_id: `REQ-${Date.now()}`,
      user_id: uId,
      book_id: existingBook ? existingBook._id : null,
      title: title.trim(),
      author: author.trim(),
      isbn: isbn?.trim() || 'N/A',
      request_type: finalType,
      request_date: new Date(),
      status: 'pending',
      priority: finalPriority,
      comments: detailsStr,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('book_requests').insertOne(newRequestDoc);

    res.status(201).json({
      success: true,
      message: 'Book request submitted successfully and queued for librarian review.',
      request: newRequestDoc
    });
  } catch (err) {
    console.error('Request creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit book request.' });
  }
});

// View requests submitted by a specific student/faculty
app.get('/api/requests/my-requests/:userId', async (req, res) => {
  try {
    const uId = toObjectId(req.params.userId);
    if (!uId) return res.status(400).json({ error: 'Invalid user ID.' });

    const requests = await db.collection('book_requests')
      .find({ user_id: uId })
      .sort({ request_date: -1 })
      .toArray();

    res.json({ requests });
  } catch (err) {
    console.error('My requests error:', err);
    res.status(500).json({ error: 'Failed to retrieve book requests.' });
  }
});

// -------------------------------------------------------------
// 5. LIBRARIAN DASHBOARD & LOGS
// -------------------------------------------------------------

app.get('/api/librarian/dashboard', async (req, res) => {
  try {
    // 1. Total issued books across the entire library
    const totalIssued = await db.collection('borrow_transactions').countDocuments({
      status: { $in: ['borrowed', 'overdue', 'BORROWED', 'OVERDUE'] }
    });

    // 2. Total amount of unpaid fines across all students and faculty
    const finesAgg = await db.collection('fines_and_payments').aggregate([
      { $match: { status: { $in: ['pending', 'partially_paid'] } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          paid: { $sum: '$amount_paid' }
        }
      }
    ]).toArray();

    const totalUnpaidFines = finesAgg.length > 0
      ? Math.max(0, (finesAgg[0].total || 0) - (finesAgg[0].paid || 0))
      : 0;

    // 3. Additional high-level catalog stats
    const totalBooks = await db.collection('books').countDocuments();
    const totalCopies = await db.collection('book_copies').countDocuments();
    const totalMembers = await db.collection('users').countDocuments({ status: 'active' });

    // 4. Log of books issued or returned (sorted recent first)
    const logs = await db.collection('borrow_transactions').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: 'book_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      {
        $lookup: {
          from: 'book_copies',
          localField: 'copy_id',
          foreignField: '_id',
          as: 'copy'
        }
      },
      { $sort: { borrow_date: -1 } },
      { $limit: 100 }
    ]).toArray();

    const formattedLogs = logs.map(txn => {
      const u = txn.user && txn.user[0] ? txn.user[0] : { name: 'Unknown User', user_id: 'N/A', role: 'N/A' };
      const b = txn.book && txn.book[0] ? txn.book[0] : (txn.book_snapshot || { title: 'Unknown Title', isbn: 'N/A' });
      const c = txn.copy && txn.copy[0] ? txn.copy[0] : { barcode: txn.book_snapshot?.barcode || 'N/A' };
      const isReturned = txn.status === 'returned' || txn.status === 'RETURNED';

      return {
        _id: txn._id,
        transaction_id: txn.transaction_id || txn._id.toString(),
        user_name: u.name,
        user_reg_no: u.user_id,
        user_role: u.role,
        book_title: b.title,
        isbn: b.isbn,
        barcode: c.barcode,
        borrow_date: txn.borrow_date,
        due_date: txn.due_date,
        return_date: txn.return_date,
        status: txn.status.toLowerCase(),
        is_returned: isReturned,
        fine_amount: txn.fine_amount || 0
      };
    });

    res.json({
      stats: {
        total_issued: totalIssued,
        total_unpaid_fines: totalUnpaidFines,
        total_books: totalBooks,
        total_copies: totalCopies,
        total_members: totalMembers
      },
      logs: formattedLogs
    });
  } catch (err) {
    console.error('Librarian dashboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve librarian dashboard data.' });
  }
});

// Mark a book as returned by Librarian (ACID transaction)
app.post('/api/librarian/return-book', async (req, res) => {
  const { transaction_id, librarian_id } = req.body;
  const tId = toObjectId(transaction_id);
  const libId = toObjectId(librarian_id);

  if (!tId) return res.status(400).json({ error: 'Invalid transaction ID.' });

  const session = client.startSession();
  try {
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' }
    });

    const txn = await db.collection('borrow_transactions').findOne({ _id: tId }, { session });
    if (!txn) throw new Error('Transaction record not found.');

    if (txn.status === 'returned' || txn.status === 'RETURNED') {
      throw new Error('This loan has already been marked as returned.');
    }

    const returnTime = new Date();

    // 1. Update transaction
    await db.collection('borrow_transactions').updateOne(
      { _id: tId },
      {
        $set: {
          status: 'returned',
          return_date: returnTime,
          returned_to: libId,
          updated_at: returnTime
        }
      },
      { session }
    );

    // 2. Decrement user active borrow count
    await db.collection('users').updateOne(
      { _id: txn.user_id },
      { $inc: { active_borrows_count: -1 }, $set: { updated_at: returnTime } },
      { session }
    );

    // 3. Increment book catalog available copies
    await db.collection('books').updateOne(
      { _id: txn.book_id },
      { $inc: { available_copies: 1 }, $set: { updated_at: returnTime } },
      { session }
    );

    // 4. Mark physical copy as available
    await db.collection('book_copies').updateOne(
      { _id: txn.copy_id },
      { $set: { status: 'available', updated_at: returnTime } },
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Book successfully checked in and catalog inventory restored to available.',
      return_date: returnTime
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Return book error:', err);
    res.status(400).json({ error: err.message || 'Failed to check in book.' });
  } finally {
    await session.endSession();
  }
});

// -------------------------------------------------------------
// 6. LIBRARIAN STUDENT / MEMBER LOOKUP & FINE WAIVER/PAYMENT
// -------------------------------------------------------------

// Search student by Registration No (user_id in MongoDB)
app.get('/api/librarian/student-lookup/:studentId', async (req, res) => {
  try {
    const regNo = req.params.studentId?.trim();
    if (!regNo) return res.status(400).json({ error: 'Please enter a student Registration Number (user_id).' });

    const student = await db.collection('users').findOne({
      user_id: { $regex: new RegExp(`^${regNo}$`, 'i') }
    });

    if (!student) {
      return res.status(404).json({ error: `No student/member found with Registration Number '${regNo}'.` });
    }

    // Retrieve all borrow transactions for this student
    const allTxns = await db.collection('borrow_transactions').aggregate([
      { $match: { user_id: student._id } },
      {
        $lookup: {
          from: 'books',
          localField: 'book_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      {
        $lookup: {
          from: 'book_copies',
          localField: 'copy_id',
          foreignField: '_id',
          as: 'copy'
        }
      },
      {
        $lookup: {
          from: 'fines_and_payments',
          let: { txnId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$transaction_id', '$$txnId'] }
                  ]
                }
              }
            }
          ],
          as: 'fines'
        }
      },
      { $sort: { borrow_date: -1 } }
    ]).toArray();

    const now = new Date();
    const issuedBooks = [];
    const returnedBooks = [];
    let totalCalculatedFineDue = 0;

    for (const txn of allTxns) {
      const book = txn.book && txn.book[0] ? txn.book[0] : (txn.book_snapshot || { title: 'Unknown Title', isbn: 'N/A' });
      const copy = txn.copy && txn.copy[0] ? txn.copy[0] : { barcode: txn.book_snapshot?.barcode || 'N/A' };
      const isReturned = txn.status === 'returned' || txn.status === 'RETURNED';

      const dueDate = new Date(txn.due_date);
      const isOverdue = !isReturned && now > dueDate;
      const overdueDays = isOverdue ? Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)) : 0;

      // Determine fine for this transaction
      let fineDue = 0;
      let fineDocId = null;
      let fineStatus = 'none';

      if (txn.fines && txn.fines.length > 0) {
        const pendingOrUnpaid = txn.fines.find(f => f.status === 'pending' || f.status === 'partially_paid');
        if (pendingOrUnpaid) {
          fineDue = Math.max(0, (pendingOrUnpaid.amount || 0) - (pendingOrUnpaid.amount_paid || 0));
          fineDocId = pendingOrUnpaid._id;
          fineStatus = pendingOrUnpaid.status;
        } else {
          fineStatus = txn.fines[0].status;
        }
      } else if (txn.fine_amount && txn.fine_amount > 0) {
        fineDue = txn.fine_amount;
        fineStatus = 'pending';
      } else if (isOverdue && overdueDays > 0) {
        fineDue = overdueDays * 5;
        fineStatus = 'pending';
      }

      const item = {
        _id: txn._id,
        transaction_id: txn.transaction_id || txn._id.toString(),
        book_title: book.title,
        isbn: book.isbn,
        barcode: copy.barcode,
        borrow_date: txn.borrow_date,
        due_date: txn.due_date,
        return_date: txn.return_date,
        status: txn.status.toLowerCase(),
        is_overdue: isOverdue,
        overdue_days: overdueDays,
        fine_due: fineDue,
        fine_status: fineStatus,
        fine_doc_id: fineDocId
      };

      if (isReturned) {
        returnedBooks.push(item);
      } else {
        totalCalculatedFineDue += fineDue;
        issuedBooks.push(item);
      }
    }

    res.json({
      student: {
        _id: student._id,
        user_id: student.user_id,
        name: student.name,
        email: student.email,
        role: student.role,
        department: student.department || 'Computer Science & Engineering',
        active_borrows_count: issuedBooks.length,
        total_fines_due: totalCalculatedFineDue
      },
      issued_books: issuedBooks,
      returned_books: returnedBooks
    });
  } catch (err) {
    console.error('Student lookup error:', err);
    res.status(500).json({ error: 'Failed to look up student.' });
  }
});

// Pay fine by Librarian
app.post('/api/librarian/pay-fine', async (req, res) => {
  try {
    const { transaction_id, user_id, amount, librarian_id, payment_method } = req.body;
    const tId = toObjectId(transaction_id);
    const uId = toObjectId(user_id);
    const libId = toObjectId(librarian_id);

    if (!tId || !uId) return res.status(400).json({ error: 'Transaction ID and User ID are required.' });

    const payAmount = Number(amount) || 0;
    const receiptNum = `RCP-LIB-${Date.now()}`;

    // Update or insert into fines_and_payments
    const existingFine = await db.collection('fines_and_payments').findOne({
      user_id: uId,
      transaction_id: tId,
      status: { $in: ['pending', 'partially_paid'] }
    });

    if (existingFine) {
      await db.collection('fines_and_payments').updateOne(
        { _id: existingFine._id },
        {
          $set: {
            status: 'paid',
            amount_paid: existingFine.amount,
            paid_date: new Date(),
            payment_method: payment_method || 'cash',
            processed_by: libId,
            receipt_number: receiptNum,
            remarks: 'Fine collected at library front desk.',
            updated_at: new Date()
          }
        }
      );
    } else {
      await db.collection('fines_and_payments').insertOne({
        _id: new ObjectId(),
        fine_id: `FINE-${Date.now()}`,
        transaction_id: tId,
        user_id: uId,
        amount: payAmount,
        amount_paid: payAmount,
        fine_reason: 'overdue',
        status: 'paid',
        issued_date: new Date(),
        paid_date: new Date(),
        payment_method: payment_method || 'cash',
        processed_by: libId,
        receipt_number: receiptNum,
        remarks: 'Fine collected and cleared by librarian.',
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Clear transaction fine amount
    await db.collection('borrow_transactions').updateOne(
      { _id: tId },
      { $set: { fine_amount: 0, updated_at: new Date() } }
    );

    // Sync student total_fines_due accurately
    const pendingFinesPay = await db.collection('fines_and_payments').aggregate([
      { $match: { user_id: uId, status: { $in: ['pending', 'partially_paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, paid: { $sum: '$amount_paid' } } }
    ]).toArray();
    const newTotalFinesPay = pendingFinesPay.length > 0
      ? Math.max(0, (pendingFinesPay[0].total || 0) - (pendingFinesPay[0].paid || 0))
      : 0;

    await db.collection('users').updateOne(
      { _id: uId },
      { $set: { total_fines_due: newTotalFinesPay, updated_at: new Date() } }
    );

    res.json({
      success: true,
      message: `Fine of ₹${payAmount} marked as PAID. Receipt ${receiptNum} recorded in database.`,
      receipt_number: receiptNum
    });
  } catch (err) {
    console.error('Librarian pay fine error:', err);
    res.status(500).json({ error: err.message || 'Failed to process fine payment.' });
  }
});

// Waive fine by Librarian
app.post('/api/librarian/waive-fine', async (req, res) => {
  try {
    const { transaction_id, user_id, amount, librarian_id, remarks } = req.body;
    const tId = toObjectId(transaction_id);
    const uId = toObjectId(user_id);
    const libId = toObjectId(librarian_id);

    if (!tId || !uId) return res.status(400).json({ error: 'Transaction ID and User ID are required.' });

    const waiveAmount = Number(amount) || 0;
    const reasonText = remarks?.trim() || 'Librarian administrative waiver.';

    // Update or insert into fines_and_payments with status 'waived'
    const existingFine = await db.collection('fines_and_payments').findOne({
      user_id: uId,
      transaction_id: tId,
      status: { $in: ['pending', 'partially_paid'] }
    });

    if (existingFine) {
      await db.collection('fines_and_payments').updateOne(
        { _id: existingFine._id },
        {
          $set: {
            status: 'waived',
            payment_method: 'waiver',
            processed_by: libId,
            paid_date: new Date(),
            remarks: reasonText,
            updated_at: new Date()
          }
        }
      );
    } else {
      await db.collection('fines_and_payments').insertOne({
        _id: new ObjectId(),
        fine_id: `FINE-WAIVED-${Date.now()}`,
        transaction_id: tId,
        user_id: uId,
        amount: waiveAmount,
        amount_paid: 0,
        fine_reason: 'overdue',
        status: 'waived',
        issued_date: new Date(),
        paid_date: new Date(),
        payment_method: 'waiver',
        processed_by: libId,
        remarks: reasonText,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Clear transaction fine amount
    await db.collection('borrow_transactions').updateOne(
      { _id: tId },
      { $set: { fine_amount: 0, updated_at: new Date() } }
    );

    // Sync student total_fines_due accurately
    const pendingFinesWaive = await db.collection('fines_and_payments').aggregate([
      { $match: { user_id: uId, status: { $in: ['pending', 'partially_paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, paid: { $sum: '$amount_paid' } } }
    ]).toArray();
    const newTotalFinesWaive = pendingFinesWaive.length > 0
      ? Math.max(0, (pendingFinesWaive[0].total || 0) - (pendingFinesWaive[0].paid || 0))
      : 0;

    await db.collection('users').updateOne(
      { _id: uId },
      { $set: { total_fines_due: newTotalFinesWaive, updated_at: new Date() } }
    );

    res.json({
      success: true,
      message: `Fine of ₹${waiveAmount} has been WAIVED. Action committed to MongoDB.`
    });
  } catch (err) {
    console.error('Librarian waive fine error:', err);
    res.status(500).json({ error: err.message || 'Failed to waive fine.' });
  }
});

// -------------------------------------------------------------
// 7. LIBRARIAN BOOK REQUESTS APPROVAL / REJECTION
// -------------------------------------------------------------

// List all requests with patron details
app.get('/api/librarian/requests', async (req, res) => {
  try {
    const requests = await db.collection('book_requests').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: 'book_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $sort: { request_date: -1 } }
    ]).toArray();

    const formatted = requests.map(r => {
      const u = r.user && r.user[0] ? r.user[0] : { name: 'Unknown User', user_id: 'N/A', role: 'N/A', department: 'N/A' };
      const b = r.book && r.book[0] ? r.book[0] : null;

      return {
        _id: r._id,
        request_id: r.request_id || r._id.toString(),
        title: r.title,
        author: r.author || (b ? b.authors?.join(', ') : 'N/A'),
        isbn: r.isbn || (b ? b.isbn : 'N/A'),
        request_type: r.request_type,
        request_date: r.request_date,
        status: r.status,
        priority: r.priority || 'medium',
        comments: r.comments || '',
        user_name: u.name,
        user_reg_no: u.user_id,
        user_role: u.role,
        user_department: u.department,
        reviewed_by: r.reviewed_by
      };
    });

    res.json({ requests: formatted });
  } catch (err) {
    console.error('Librarian requests error:', err);
    res.status(500).json({ error: 'Failed to retrieve book requests.' });
  }
});

// Approve or Reject request
app.post('/api/librarian/requests/:id/action', async (req, res) => {
  try {
    const reqId = toObjectId(req.params.id);
    const { action, librarian_id } = req.body;
    const libId = toObjectId(librarian_id);

    if (!reqId) return res.status(400).json({ error: 'Invalid request ID.' });
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject".' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const result = await db.collection('book_requests').updateOne(
      { _id: reqId },
      {
        $set: {
          status: newStatus,
          reviewed_by: libId,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Book request record not found.' });
    }

    res.json({
      success: true,
      message: `Book request ${action === 'approve' ? 'APPROVED' : 'REJECTED'} successfully in MongoDB.`,
      status: newStatus
    });
  } catch (err) {
    console.error('Request action error:', err);
    res.status(500).json({ error: err.message || 'Failed to update book request.' });
  }
});

// Fallback route for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Library Management System Running at: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
});
