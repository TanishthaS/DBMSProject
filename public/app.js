// ==========================================================================
// Library Management System - Frontend Application Logic
// Direct MongoDB REST API Client
// No Emojis Used
// ==========================================================================

let currentUser = null;
let currentSection = 'hero';
let catalogDebounceTimer = null;
let circulationLogsCache = [];

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  restoreSession();
  setupEventListeners();
  loadBooksCatalog();
});

// -------------------------------------------------------------
// SESSION & NAVIGATION
// -------------------------------------------------------------

function restoreSession() {
  try {
    const saved = localStorage.getItem('lms_current_user');
    if (saved) {
      currentUser = JSON.parse(saved);
      updateHeaderAuthUI();
      // Verify profile from server for latest counters
      fetch(`/api/auth/profile/${currentUser._id}`)
        .then(res => res.json())
        .then(profile => {
          if (profile && !profile.error) {
            currentUser = profile;
            localStorage.setItem('lms_current_user', JSON.stringify(currentUser));
            updateHeaderAuthUI();
          }
        })
        .catch(() => {});
    } else {
      updateHeaderAuthUI();
    }
  } catch (e) {
    currentUser = null;
    updateHeaderAuthUI();
  }
}

function updateHeaderAuthUI() {
  const loginNavBtn = document.getElementById('nav-login-btn');
  const userPill = document.getElementById('user-pill');
  const pillName = document.getElementById('pill-user-name');
  const pillRole = document.getElementById('pill-user-role');

  const authNavs = document.querySelectorAll('.auth-nav');
  const userOnlyLinks = document.querySelectorAll('.user-only');
  const libOnlyLinks = document.querySelectorAll('.lib-only');

  if (currentUser) {
    if (loginNavBtn) loginNavBtn.style.display = 'none';
    if (userPill) {
      userPill.style.display = 'flex';
      pillName.textContent = currentUser.name;
      pillRole.textContent = currentUser.role.toUpperCase();
    }

    // Both patrons and librarians can issue books
    authNavs.forEach(el => el.style.display = 'inline-block');

    if (currentUser.role === 'librarian' || currentUser.role === 'admin') {
      userOnlyLinks.forEach(el => el.style.display = 'none');
      libOnlyLinks.forEach(el => el.style.display = 'inline-block');
    } else {
      userOnlyLinks.forEach(el => el.style.display = 'inline-block');
      libOnlyLinks.forEach(el => el.style.display = 'none');
    }
  } else {
    // When not logged in: only show Hero and Log In / Sign Up
    if (loginNavBtn) loginNavBtn.style.display = 'inline-block';
    if (userPill) userPill.style.display = 'none';
    authNavs.forEach(el => el.style.display = 'none');
    userOnlyLinks.forEach(el => el.style.display = 'none');
    libOnlyLinks.forEach(el => el.style.display = 'none');
  }
}

function navigateTo(targetId) {
  currentSection = targetId;

  // Hide all sections
  document.querySelectorAll('.page-section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.getAttribute('data-target') === targetId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Map route target to section element ID
  let targetElementId = '';
  if (targetId === 'hero') targetElementId = 'hero-section';
  else if (targetId === 'auth') targetElementId = 'auth-section';
  else if (targetId === 'catalog') targetElementId = 'catalog-section';
  else if (targetId === 'request') targetElementId = 'request-section';
  else if (targetId === 'student-dash') targetElementId = 'student-dashboard-section';
  else if (targetId === 'librarian-dash') targetElementId = 'librarian-dash-section';
  else if (targetId === 'librarian-lookup') targetElementId = 'librarian-lookup-section';
  else if (targetId === 'librarian-requests') targetElementId = 'librarian-requests-section';

  const sectionEl = document.getElementById(targetElementId);
  if (sectionEl) {
    sectionEl.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Load section-specific fresh data
  if (targetId === 'student-dash') {
    loadStudentDashboard();
  } else if (targetId === 'catalog') {
    loadBooksCatalog();
  } else if (targetId === 'request') {
    if (currentUser) loadMyRequests();
  } else if (targetId === 'librarian-dash') {
    loadLibrarianDashboard();
  } else if (targetId === 'librarian-requests') {
    loadLibrarianRequests();
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('lms_current_user');
  updateHeaderAuthUI();
  showToast('Logged out of session.', 'info');
  navigateTo('hero');
}

// -------------------------------------------------------------
// AUTHENTICATION LOGIC (LOGIN & SIGN UP)
// -------------------------------------------------------------

function switchAuthTab(tab) {
  const loginTab = document.getElementById('tab-login');
  const signupTab = document.getElementById('tab-signup');
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');

  if (tab === 'login') {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    formLogin.style.display = 'block';
    formSignup.style.display = 'none';
  } else {
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
    formLogin.style.display = 'none';
    formSignup.style.display = 'block';
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const idInput = document.getElementById('login-id');
  const roleSelect = document.getElementById('login-role');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('btn-login-submit');

  const role = roleSelect.value;
  const identifier = idInput.value.trim();
  const password = passwordInput.value;

  if (!role) {
    showToast('Please choose what type of user you are (Student, Faculty, or Librarian).', 'error');
    return;
  }

  if (!identifier) {
    showToast('Please provide your Registration No, User ID, or Email.', 'error');
    return;
  }

  if (!password) {
    showToast('Please enter your password.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying credentials...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    currentUser = data.user;
    localStorage.setItem('lms_current_user', JSON.stringify(currentUser));
    updateHeaderAuthUI();
    showToast(`Access granted. Welcome, ${currentUser.name}.`, 'success');

    // Route to appropriate dashboard
    if (currentUser.role === 'librarian' || currentUser.role === 'admin') {
      navigateTo('librarian-dash');
    } else {
      navigateTo('student-dash');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
  }
}

async function handleSignupSubmit(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('btn-signup-submit');

  const role = document.getElementById('signup-role').value;
  const regNo = document.getElementById('signup-reg').value.trim();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const dept = document.getElementById('signup-dept').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const street = document.getElementById('signup-street').value.trim();

  if (!role) {
    showToast('Please select what type of user you are.', 'error');
    return;
  }

  if (!name || !regNo || !email) {
    showToast('Name, Registration No, and Email are required fields.', 'error');
    return;
  }

  if (!password) {
    showToast('Password is required.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        user_id: regNo,
        email,
        password,
        role,
        department: dept,
        phone,
        address: { street, city: 'Vellore', state: 'Tamil Nadu', postal_code: '632014' }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    currentUser = data.user;
    localStorage.setItem('lms_current_user', JSON.stringify(currentUser));
    updateHeaderAuthUI();
    showToast('Account successfully created. Logged in.', 'success');

    if (currentUser.role === 'librarian' || currentUser.role === 'admin') {
      navigateTo('librarian-dash');
    } else {
      navigateTo('student-dash');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign Up';
  }
}

// -------------------------------------------------------------
// STUDENT & FACULTY DASHBOARD LOGIC
// -------------------------------------------------------------

async function loadStudentDashboard() {
  if (!currentUser) {
    navigateTo('auth');
    showToast('Please log in to view patron dashboard.', 'info');
    return;
  }

  document.getElementById('dash-patron-name').textContent = currentUser.name;
  document.getElementById('dash-patron-id').textContent = `Registration No: ${currentUser.user_id} | ${currentUser.department || 'General'}`;
  document.getElementById('dash-patron-role').textContent = `${currentUser.role.toUpperCase()} DASHBOARD`;

  try {
    const res = await fetch(`/api/student/dashboard/${currentUser._id}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to load dashboard data.');

    // Update Top 3 Metrics
    document.getElementById('stat-books-issued').textContent = data.stats.books_issued;
    document.getElementById('stat-max-allowed').textContent = `Maximum Quota: ${data.stats.max_allowed} books`;
    document.getElementById('stat-can-issue').textContent = data.stats.can_issue_more;
    document.getElementById('stat-total-fine').textContent = `₹ ${data.stats.total_fine}`;

    // Render Issued Books Table
    const tbody = document.getElementById('tbody-issued-books');
    const countLabel = document.getElementById('issued-books-count-label');

    tbody.innerHTML = '';
    const books = data.issued_books || [];
    countLabel.textContent = `${books.length} record${books.length === 1 ? '' : 's'} found`;

    if (books.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">No books currently issued. Browse the catalog to issue available titles.</td>
        </tr>
      `;
      return;
    }

    books.forEach(item => {
      const tr = document.createElement('tr');

      const borrowDateStr = new Date(item.borrow_date).toLocaleDateString();
      const dueDateStr = new Date(item.due_date).toLocaleDateString();

      const statusBadge = item.is_overdue
        ? `<span class="badge badge-orange">OVERDUE (${item.overdue_days}d)</span>`
        : `<span class="badge badge-green">ACTIVE</span>`;

      const fineDisplay = item.fine_amount > 0
        ? `<span class="orange-text font-bold">₹ ${item.fine_amount}</span>`
        : `<span class="green-text">₹ 0</span>`;

      // Renew button logic
      let renewBtn = '';
      if (item.can_renew) {
        renewBtn = `<button class="btn btn-sm btn-outline" onclick="handleRenewBook('${item._id}')">Renew (${item.renewal_count}/3)</button>`;
      } else {
        renewBtn = `<span class="text-muted" style="font-size:11px;">Limit Reached</span>`;
      }

      // Pay fine button logic
      let payBtn = '';
      if (item.can_pay_fine) {
        payBtn = `<button class="btn btn-action-green" onclick="handlePayFine('${item._id}', ${item.fine_amount})">Pay Fine (₹${item.fine_amount})</button>`;
      }

      tr.innerHTML = `
        <td><strong>${escapeHtml(item.book_title)}</strong></td>
        <td><code>${escapeHtml(item.isbn)}</code></td>
        <td><code>${escapeHtml(item.barcode)}</code></td>
        <td>${borrowDateStr}</td>
        <td>${dueDateStr}</td>
        <td>${statusBadge}</td>
        <td>${fineDisplay}</td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            ${renewBtn}
            ${payBtn}
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRenewBook(transactionId) {
  if (!currentUser) return;

  try {
    const res = await fetch('/api/student/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId, user_id: currentUser._id })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to renew book.');

    showToast(data.message, 'success');
    loadStudentDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handlePayFine(transactionId, amount) {
  if (!currentUser) return;

  const confirmed = confirm(`Proceed with fine payment of ₹${amount}?`);
  if (!confirmed) return;

  try {
    const res = await fetch('/api/student/pay-fine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: transactionId,
        user_id: currentUser._id,
        amount: amount,
        payment_method: 'online'
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment failed.');

    showToast(data.message, 'success');
    loadStudentDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// CATALOG & ISSUE BOOKS LOGIC
// -------------------------------------------------------------

function handleCatalogFilter() {
  clearTimeout(catalogDebounceTimer);
  catalogDebounceTimer = setTimeout(() => {
    loadBooksCatalog();
  }, 220);
}

function resetCatalogFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-author').value = '';
  document.getElementById('filter-publisher').value = '';
  document.getElementById('filter-isbn').value = '';
  document.getElementById('filter-available-only').checked = false;
  document.getElementById('filter-sort').value = 'name_asc';
  loadBooksCatalog();
}

async function loadBooksCatalog() {
  const search = document.getElementById('filter-search')?.value || '';
  const author = document.getElementById('filter-author')?.value || '';
  const publisher = document.getElementById('filter-publisher')?.value || '';
  const isbn = document.getElementById('filter-isbn')?.value || '';
  const availableOnly = document.getElementById('filter-available-only')?.checked ? 'true' : 'false';
  const sort = document.getElementById('filter-sort')?.value || 'name_asc';

  const params = new URLSearchParams({
    search,
    author,
    publisher,
    isbn,
    available_only: availableOnly,
    sort
  });

  const countLabel = document.getElementById('catalog-count-label');
  const container = document.getElementById('books-list-container');

  if (countLabel) countLabel.textContent = 'Querying MongoDB catalog collection...';

  try {
    const res = await fetch(`/api/books?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch catalog.');

    const books = data.books || [];
    if (countLabel) countLabel.textContent = `Showing ${books.length} catalog title${books.length === 1 ? '' : 's'}`;

    container.innerHTML = '';

    if (books.length === 0) {
      container.innerHTML = `
        <div class="panel-box" style="text-align: center; color: var(--text-muted); padding: 40px;">
          No titles found matching current filter parameters.
        </div>
      `;
      return;
    }

    books.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-item-card';

      const isAvailable = book.available_copies > 0;
      const statusBadge = isAvailable
        ? `<span class="badge badge-green">IN STOCK</span>`
        : `<span class="badge badge-orange">CHECKED OUT</span>`;

      const issueBtn = isAvailable
        ? `<button class="btn btn-secondary btn-sm" onclick="handleIssueBook('${book._id}', '${escapeAttr(book.title)}')">Issue Book</button>`
        : `<button class="btn btn-outline btn-sm" disabled>Unavailable</button>`;

      card.innerHTML = `
        <div class="book-main-info">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
            <h3 class="book-item-title">${escapeHtml(book.title)}</h3>
            ${statusBadge}
          </div>
          <div class="book-item-authors">By ${escapeHtml(book.authors.join(', '))}</div>
          <div class="book-metadata-strip">
            <span class="meta-token"><strong>Publisher:</strong> ${escapeHtml(book.publisher)} (${book.publication_year})</span>
            <span class="meta-token"><strong>ISBN:</strong> ${escapeHtml(book.isbn)}</span>
            <span class="meta-token"><strong>Edition:</strong> ${escapeHtml(book.edition)}</span>
            <span class="meta-token"><strong>Shelf:</strong> ${escapeHtml(book.shelf_location)}</span>
          </div>
        </div>

        <div class="book-stock-info">
          <div class="stock-meter">
            <span class="${isAvailable ? 'green-text' : 'orange-text'}" style="font-size:16px; font-weight:700;">
              ${book.available_copies}
            </span>
            <span style="color:var(--text-muted);">/ ${book.total_copies} available</span>
          </div>
          ${issueBtn}
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleIssueBook(bookId, bookTitle) {
  if (!currentUser) {
    showToast('Please log in or register an account to issue books.', 'info');
    navigateTo('auth');
    return;
  }

  const confirmed = confirm(`Confirm loan issuance for: "${bookTitle}"?`);
  if (!confirmed) return;

  try {
    const res = await fetch('/api/books/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId, user_id: currentUser._id })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to issue book.');

    showToast(data.message, 'success');

    // Update active borrow count locally
    currentUser.active_borrows_count = data.active_borrows_count;
    localStorage.setItem('lms_current_user', JSON.stringify(currentUser));

    loadBooksCatalog();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// BOOK REQUESTS LOGIC
// -------------------------------------------------------------

async function handleBookRequestSubmit(event) {
  event.preventDefault();
  if (!currentUser) {
    showToast('Please log in before submitting a requisition.', 'info');
    navigateTo('auth');
    return;
  }

  const submitBtn = document.getElementById('btn-submit-request');

  const title = document.getElementById('req-title').value.trim();
  const author = document.getElementById('req-author').value.trim();
  const isbn = document.getElementById('req-isbn').value.trim();
  const publisher = document.getElementById('req-publisher').value.trim();
  const year = document.getElementById('req-year').value.trim();
  const version = document.getElementById('req-version').value.trim();
  const request_type = document.getElementById('req-type').value;
  const priority = document.getElementById('req-priority').value;
  const comments = document.getElementById('req-notes').value.trim();

  if (!title || !author) {
    showToast('Title and Author are required fields.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Inserting into MongoDB...';

  try {
    const res = await fetch('/api/requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser._id,
        title,
        author,
        isbn,
        publisher,
        year,
        version,
        request_type,
        priority,
        comments
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit book request.');

    showToast(data.message, 'success');
    document.getElementById('form-request-book').reset();
    loadMyRequests();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request (Commit to MongoDB)';
  }
}

async function loadMyRequests() {
  if (!currentUser) return;

  const tbody = document.getElementById('tbody-my-requests');
  const countLabel = document.getElementById('my-requests-count-label');

  try {
    const res = await fetch(`/api/requests/my-requests/${currentUser._id}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch your requests.');

    const requests = data.requests || [];
    countLabel.textContent = `${requests.length} record${requests.length === 1 ? '' : 's'}`;

    tbody.innerHTML = '';
    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No requests submitted yet.</td></tr>`;
      return;
    }

    requests.forEach(r => {
      const tr = document.createElement('tr');
      const dateStr = new Date(r.request_date).toLocaleDateString();

      let badgeClass = 'badge-neutral';
      if (r.status === 'approved' || r.status === 'fulfilled') badgeClass = 'badge-green';
      else if (r.status === 'rejected' || r.status === 'cancelled') badgeClass = 'badge-orange';

      tr.innerHTML = `
        <td><code>${escapeHtml(r.request_id || r._id)}</code></td>
        <td>
          <strong>${escapeHtml(r.title)}</strong><br>
          <span style="font-size:12px; color:var(--text-secondary);">${escapeHtml(r.author || '')}</span>
        </td>
        <td><span style="text-transform: capitalize;">${escapeHtml(r.request_type)}</span></td>
        <td>${dateStr}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(r.status)}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// LIBRARIAN DASHBOARD & CIRCULATION LOGS
// -------------------------------------------------------------

async function loadLibrarianDashboard() {
  if (!currentUser || (currentUser.role !== 'librarian' && currentUser.role !== 'admin')) {
    navigateTo('auth');
    showToast('Librarian administrative credentials required.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/librarian/dashboard');
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch librarian dashboard.');

    // Top metrics
    document.getElementById('lib-stat-issued').textContent = data.stats.total_issued;
    document.getElementById('lib-stat-fines').textContent = `₹ ${data.stats.total_unpaid_fines}`;
    document.getElementById('lib-stat-books').textContent = data.stats.total_books;
    document.getElementById('lib-stat-members').textContent = data.stats.total_members;

    circulationLogsCache = data.logs || [];
    renderCirculationLogs(circulationLogsCache);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleLogSearch() {
  const query = document.getElementById('log-search-input')?.value.toLowerCase().trim() || '';
  if (!query) {
    renderCirculationLogs(circulationLogsCache);
    return;
  }

  const filtered = circulationLogsCache.filter(item => {
    return (
      (item.user_name && item.user_name.toLowerCase().includes(query)) ||
      (item.user_reg_no && item.user_reg_no.toLowerCase().includes(query)) ||
      (item.book_title && item.book_title.toLowerCase().includes(query)) ||
      (item.barcode && item.barcode.toLowerCase().includes(query)) ||
      (item.transaction_id && item.transaction_id.toLowerCase().includes(query))
    );
  });

  renderCirculationLogs(filtered);
}

function renderCirculationLogs(logs) {
  const tbody = document.getElementById('tbody-circulation-logs');
  tbody.innerHTML = '';

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-state">No circulation logs recorded.</td></tr>`;
    return;
  }

  logs.forEach(txn => {
    const tr = document.createElement('tr');

    const borrowDateStr = new Date(txn.borrow_date).toLocaleDateString();
    const dueDateStr = new Date(txn.due_date).toLocaleDateString();
    const returnDateStr = txn.return_date ? new Date(txn.return_date).toLocaleDateString() : '-';

    let statusBadge = '';
    if (txn.is_returned) {
      statusBadge = `<span class="badge badge-neutral">RETURNED</span>`;
    } else if (txn.status === 'overdue') {
      statusBadge = `<span class="badge badge-orange">OVERDUE</span>`;
    } else {
      statusBadge = `<span class="badge badge-green">BORROWED</span>`;
    }

    const checkInBtn = !txn.is_returned
      ? `<button class="btn btn-action-green btn-sm" onclick="handleCheckInBook('${txn._id}')">Check In</button>`
      : `<span style="color:var(--text-muted); font-size:11px;">Completed</span>`;

    tr.innerHTML = `
      <td><code>${escapeHtml(txn.transaction_id)}</code></td>
      <td>
        <strong>${escapeHtml(txn.user_name)}</strong><br>
        <span style="font-size:11px; color:var(--accent-orange);">${escapeHtml(txn.user_reg_no)}</span>
      </td>
      <td><span style="text-transform: capitalize;">${escapeHtml(txn.user_role)}</span></td>
      <td>${escapeHtml(txn.book_title)}</td>
      <td><code>${escapeHtml(txn.barcode)}</code></td>
      <td>${borrowDateStr}</td>
      <td>${dueDateStr}</td>
      <td>${returnDateStr}</td>
      <td>${statusBadge}</td>
      <td>${checkInBtn}</td>
    `;

    tbody.appendChild(tr);
  });
}

async function handleCheckInBook(transactionId) {
  if (!currentUser) return;

  const confirmed = confirm('Check in this book copy?');
  if (!confirmed) return;

  try {
    const res = await fetch('/api/librarian/return-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId, librarian_id: currentUser._id })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to check in book.');

    showToast(data.message, 'success');
    loadLibrarianDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// LIBRARIAN STUDENT / MEMBER LOOKUP & FINE ACTIONS
// -------------------------------------------------------------

async function handleStudentLookupSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('lookup-reg-no');
  const regNo = input.value.trim();

  if (!regNo) {
    showToast('Please enter a student Registration Number (user_id).', 'error');
    return;
  }

  const btn = document.getElementById('btn-lookup-student');
  btn.disabled = true;
  btn.textContent = 'Searching MongoDB...';

  try {
    const res = await fetch(`/api/librarian/student-lookup/${encodeURIComponent(regNo)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Lookup failed.');

    renderStudentLookupResults(data);
    showToast(`Record for ${data.student.name} (${data.student.user_id}) loaded.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
    document.getElementById('student-lookup-results').style.display = 'none';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lookup Student';
  }
}

function renderStudentLookupResults(data) {
  const container = document.getElementById('student-lookup-results');
  container.style.display = 'block';

  const s = data.student;
  document.getElementById('lookup-res-name').textContent = s.name;
  document.getElementById('lookup-res-id').textContent = s.user_id;
  document.getElementById('lookup-res-dept').textContent = s.department;
  document.getElementById('lookup-res-email').textContent = s.email;
  document.getElementById('lookup-res-borrows').textContent = s.active_borrows_count;
  document.getElementById('lookup-res-fine').textContent = `₹ ${s.total_fines_due}`;

  // Section 1: Non-returned books with fine breakdown and Pay / Waive buttons
  const issuedTbody = document.getElementById('tbody-lookup-issued');
  issuedTbody.innerHTML = '';

  const issued = data.issued_books || [];
  if (issued.length === 0) {
    issuedTbody.innerHTML = `<tr><td colspan="7" class="empty-state">No non-returned books. Patron has zero active loans.</td></tr>`;
  } else {
    issued.forEach(item => {
      const tr = document.createElement('tr');
      const borrowDateStr = new Date(item.borrow_date).toLocaleDateString();
      const dueDateStr = new Date(item.due_date).toLocaleDateString();

      const statusBadge = item.is_overdue
        ? `<span class="badge badge-orange">OVERDUE (${item.overdue_days}d)</span>`
        : `<span class="badge badge-green">ACTIVE</span>`;

      const fineDisplay = item.fine_due > 0
        ? `<span class="orange-text font-bold">₹ ${item.fine_due}</span>`
        : `<span class="green-text">₹ 0</span>`;

      let actionButtons = `
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn btn-action-green btn-sm" onclick="handleLibrarianCheckInFromLookup('${item._id}', '${escapeAttr(item.book_title)}', '${s.user_id}')">Check In</button>
      `;

      if (item.fine_due > 0) {
        actionButtons += `
          <button class="btn btn-action-green btn-sm" onclick="handleLibrarianPayFine('${item._id}', '${s._id}', ${item.fine_due}, '${s.user_id}')">Pay Fine</button>
          <button class="btn btn-action-orange btn-sm" onclick="handleLibrarianWaiveFine('${item._id}', '${s._id}', ${item.fine_due}, '${s.user_id}')">Waive Fine</button>
        `;
      }
      actionButtons += `</div>`;

      tr.innerHTML = `
        <td><strong>${escapeHtml(item.book_title)}</strong></td>
        <td><code>${escapeHtml(item.barcode)}</code></td>
        <td>${borrowDateStr}</td>
        <td>${dueDateStr}</td>
        <td>${statusBadge}</td>
        <td>${fineDisplay}</td>
        <td>${actionButtons}</td>
      `;

      issuedTbody.appendChild(tr);
    });
  }

  // Section 2: Returned books history
  const returnedTbody = document.getElementById('tbody-lookup-returned');
  returnedTbody.innerHTML = '';

  const returned = data.returned_books || [];
  if (returned.length === 0) {
    returnedTbody.innerHTML = `<tr><td colspan="5" class="empty-state">No returned books in loan history.</td></tr>`;
  } else {
    returned.forEach(item => {
      const tr = document.createElement('tr');
      const borrowDateStr = new Date(item.borrow_date).toLocaleDateString();
      const returnDateStr = item.return_date ? new Date(item.return_date).toLocaleDateString() : '-';

      tr.innerHTML = `
        <td>${escapeHtml(item.book_title)}</td>
        <td><code>${escapeHtml(item.barcode)}</code></td>
        <td>${borrowDateStr}</td>
        <td>${returnDateStr}</td>
        <td><span class="badge badge-neutral">RETURNED</span></td>
      `;

      returnedTbody.appendChild(tr);
    });
  }
}

async function handleLibrarianCheckInFromLookup(transactionId, bookTitle, regNo) {
  if (!currentUser) return;

  const confirmed = confirm(`Check in "${bookTitle}"?`);
  if (!confirmed) return;

  try {
    const res = await fetch('/api/librarian/return-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId, librarian_id: currentUser._id })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to check in book.');

    showToast('Book successfully checked in and returned.', 'success');
    refreshCurrentStudentLookup(regNo);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleLibrarianPayFine(transactionId, userId, amount, regNo) {
  if (!currentUser) return;

  const confirmed = confirm(`Record fine payment of ₹${amount} for student (${regNo})?`);
  if (!confirmed) return;

  try {
    const res = await fetch('/api/librarian/pay-fine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: transactionId,
        user_id: userId,
        amount: amount,
        librarian_id: currentUser._id,
        payment_method: 'cash'
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process payment.');

    showToast(data.message, 'success');
    // Refresh student lookup
    refreshCurrentStudentLookup(regNo);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleLibrarianWaiveFine(transactionId, userId, amount, regNo) {
  if (!currentUser) return;

  const reason = prompt(`Provide reason for waiving fine of ₹${amount} for student (${regNo}):`, 'Administrative waiver approval');
  if (reason === null) return;

  try {
    const res = await fetch('/api/librarian/waive-fine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: transactionId,
        user_id: userId,
        amount: amount,
        librarian_id: currentUser._id,
        remarks: reason || 'Librarian administrative waiver.'
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to waive fine.');

    showToast(data.message, 'success');
    // Refresh student lookup
    refreshCurrentStudentLookup(regNo);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function refreshCurrentStudentLookup(regNo) {
  document.getElementById('lookup-reg-no').value = regNo;
  document.getElementById('form-student-lookup').dispatchEvent(new Event('submit'));
}

// -------------------------------------------------------------
// LIBRARIAN BOOK REQUESTS MANAGEMENT LOGIC
// -------------------------------------------------------------

async function loadLibrarianRequests() {
  if (!currentUser || (currentUser.role !== 'librarian' && currentUser.role !== 'admin')) {
    navigateTo('auth');
    showToast('Librarian administrative credentials required.', 'error');
    return;
  }

  const tbody = document.getElementById('tbody-librarian-requests');
  const countLabel = document.getElementById('lib-reqs-count-label');

  try {
    const res = await fetch('/api/librarian/requests');
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to load requests.');

    const requests = data.requests || [];
    countLabel.textContent = `${requests.length} requisition${requests.length === 1 ? '' : 's'} registered in database`;

    tbody.innerHTML = '';
    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No requisitions currently pending or logged.</td></tr>`;
      return;
    }

    requests.forEach(r => {
      const tr = document.createElement('tr');
      const dateStr = new Date(r.request_date).toLocaleDateString();

      let badgeClass = 'badge-neutral';
      if (r.status === 'approved' || r.status === 'fulfilled') badgeClass = 'badge-green';
      else if (r.status === 'rejected' || r.status === 'cancelled') badgeClass = 'badge-orange';

      let actionHtml = '';
      if (r.status === 'pending') {
        actionHtml = `
          <div style="display:flex; gap:6px;">
            <button class="btn btn-action-green btn-sm" onclick="handleLibrarianRequestAction('${r._id}', 'approve')">Approve</button>
            <button class="btn btn-action-orange btn-sm" onclick="handleLibrarianRequestAction('${r._id}', 'reject')">Reject</button>
          </div>
        `;
      } else {
        actionHtml = `<span style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">${escapeHtml(r.status)}</span>`;
      }

      tr.innerHTML = `
        <td><code>${escapeHtml(r.request_id || r._id)}</code></td>
        <td>
          <strong>${escapeHtml(r.title)}</strong><br>
          <span style="font-size:11px; color:var(--text-secondary);">By ${escapeHtml(r.author || 'N/A')}</span>
        </td>
        <td>
          <strong>${escapeHtml(r.user_name)}</strong><br>
          <span style="font-size:11px; color:var(--accent-orange);">${escapeHtml(r.user_reg_no)} (${escapeHtml(r.user_role)})</span>
        </td>
        <td>
          <span style="text-transform: capitalize;">${escapeHtml(r.request_type)}</span><br>
          <span style="font-size:11px; color:var(--text-muted);">Priority: ${escapeHtml(r.priority)}</span>
        </td>
        <td>${dateStr}</td>
        <td><span style="font-size:12px; color:var(--text-secondary);">${escapeHtml(r.comments || '-')}</span></td>
        <td><span class="badge ${badgeClass}">${escapeHtml(r.status)}</span></td>
        <td>${actionHtml}</td>
      `;

      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleLibrarianRequestAction(requestId, action) {
  if (!currentUser) return;

  const confirmed = confirm(`Are you sure you want to ${action} this request?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/librarian/requests/${requestId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, librarian_id: currentUser._id })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update request.');

    showToast(data.message, 'success');
    loadLibrarianRequests();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// EVENT LISTENERS & UTILITIES
// -------------------------------------------------------------

function setupEventListeners() {
  // Navigation delegation
  document.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.getAttribute('data-navigate'));
    });
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
