/**
 * AegisRecover - Smart Lost & Found Platform
 * Frontend Application Engine with 5-Stage Animated Matching Pipeline,
 * Autonomous Blind Verification Probe, Escrow Management, and Physical Handover Terminal.
 */

const app = {
  activeSection: 'home',
  verifiedDesks: [],
  lostRefPhotos: [],
  secretPoints: [],
  foundDeskPhoto: null,
  foundDirectPrimaryPhoto: null,
  foundDirectExtraPhotos: [],
  adminPin: null,
  activeAdminTab: 'lost',
  currentUser: null,
  authToken: null,
  latestPasscode: null,
  latestLostItemId: null,

  init() {
    this.checkStoredAuth();
    this.setupDatePickers();
    this.loadVerifiedDesks();
    this.initSecretPoints();

    // Check url hash for section
    const hash = window.location.hash.replace('#', '');
    if (['home', 'lost', 'found', 'status', 'admin'].includes(hash)) {
      this.showSection(hash);
    } else {
      this.showSection('home');
    }
  },

  // --------------------------------------------------------------------------
  // User Authentication & Session
  // --------------------------------------------------------------------------
  checkStoredAuth() {
    this.authToken = localStorage.getItem('aegis_token');
    const storedUser = localStorage.getItem('aegis_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        this.currentUser = null;
      }
    }
    const storedAdmin = localStorage.getItem('aegis_admin_pin');
    if (storedAdmin) {
      this.adminPin = storedAdmin;
    }
    this.updateHeaderAuth();
  },

  updateHeaderAuth() {
    const container = document.getElementById('header-auth-container');
    if (!container) return;

    if (this.currentUser) {
      container.innerHTML = `
        <div class="user-badge-tag">
          <span>👤 ${this.escapeHtml(this.currentUser.full_name)}</span>
          <button class="btn btn-outline btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="app.handleUserLogout()">Logout</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button class="btn btn-outline btn-auth" onclick="app.openAuthModal()">Sign In / Register</button>
      `;
    }
  },

  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
    this.switchAuthTab('login');
  },

  closeAuthModal(e) {
    if (e && e.target && e.target.id !== 'auth-modal' && !e.target.classList.contains('modal-close-btn')) return;
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
  },

  switchAuthTab(tab) {
    const loginTab = document.getElementById('tab-auth-login');
    const regTab = document.getElementById('tab-auth-register');
    const loginForm = document.getElementById('form-auth-login');
    const regForm = document.getElementById('form-auth-register');

    if (tab === 'login') {
      loginTab.classList.add('active');
      regTab.classList.remove('active');
      loginForm.classList.remove('hidden');
      regForm.classList.add('hidden');
    } else {
      regTab.classList.add('active');
      loginTab.classList.remove('active');
      regForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    }
  },

  async handleUserLogin(e) {
    e.preventDefault();
    const ident = document.getElementById('login-ident').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await API.login({ identifier: ident, password });
      this.authToken = res.access_token;
      this.currentUser = res.user;
      localStorage.setItem('aegis_token', this.authToken);
      localStorage.setItem('aegis_user', JSON.stringify(this.currentUser));
      this.updateHeaderAuth();
      this.closeAuthModal();
      this.showToast(`Welcome back, ${this.currentUser.full_name}!`, 'success');
      this.showSection('status');
      this.handleStatusLookup(null, this.currentUser.phone);
    } catch (err) {
      this.showToast(err.message || 'Login failed', 'error');
    }
  },

  async handleUserRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      const res = await API.register({ full_name: name, email, phone, password });
      this.authToken = res.access_token;
      this.currentUser = res.user;
      localStorage.setItem('aegis_token', this.authToken);
      localStorage.setItem('aegis_user', JSON.stringify(this.currentUser));
      this.updateHeaderAuth();
      this.closeAuthModal();
      this.showToast(`Account created! Welcome, ${this.currentUser.full_name}`, 'success');
      this.showSection('status');
      this.handleStatusLookup(null, this.currentUser.phone);
    } catch (err) {
      this.showToast(err.message || 'Registration failed', 'error');
    }
  },

  handleUserLogout() {
    this.currentUser = null;
    this.authToken = null;
    localStorage.removeItem('aegis_token');
    localStorage.removeItem('aegis_user');
    this.updateHeaderAuth();
    this.showToast('You have been logged out.', 'info');
    this.showSection('home');
  },

  // --------------------------------------------------------------------------
  // 1-Click Interactive Demo Dataset Loader
  // --------------------------------------------------------------------------
  async seedDemoDataset() {
    try {
      const res = await API.seedDemo(this.adminPin || 'admin123');
      this.showToast('Demo dataset loaded successfully!', 'success');
      
      this.latestLostItemId = res.lost_item_id;

      // Populate quick track input
      const trackInput = document.getElementById('quick-track-input');
      if (trackInput) trackInput.value = '+91 98765 43210';

      const statusInput = document.getElementById('status-lookup-input');
      if (statusInput) statusInput.value = '+91 98765 43210';

      // Auto-authenticate admin session for convenience
      this.adminPin = 'admin123';
      localStorage.setItem('aegis_admin_pin', 'admin123');

      // Offer quick switch to Admin Portal to test the 5-stage algorithm
      if (confirm("Demo Dataset loaded!\n\n• Lost: Apple MacBook Pro 14 M2 (Aarav Sharma, ₹2,000 Escrow)\n• Matching Found: MacBook in Dark Cover (Rahul Verma, 50m away)\n• Decoy: Silver Water Bottle (Amit Kumar, 3.5km away)\n\nWould you like to open the Admin Portal now to run the 5-Stage Matching Engine?")) {
        this.showSection('admin');
        this.refreshAdminData();
      }
    } catch (err) {
      this.showToast(err.message || 'Failed to seed demo dataset', 'error');
    }
  },

  // --------------------------------------------------------------------------
  // Navigation & UI State
  // --------------------------------------------------------------------------
  setupDatePickers() {
    const now = new Date();
    const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    const lostDateInput = document.getElementById('lost-datetime');
    if (lostDateInput) lostDateInput.value = localDatetime;

    const foundDateInput = document.getElementById('found-direct-datetime');
    if (foundDateInput) foundDateInput.value = localDatetime;
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4500);
  },

  showSection(sectionId) {
    this.activeSection = sectionId;
    window.location.hash = sectionId;

    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeNav = document.getElementById(`nav-${sectionId}`);
    if (activeNav) activeNav.classList.add('active');

    // Update View Sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    const activeView = document.getElementById(`view-${sectionId}`);
    if (activeView) activeView.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (sectionId === 'admin') {
      if (this.adminPin) {
        document.getElementById('admin-auth-box').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        this.refreshAdminData();
      } else {
        document.getElementById('admin-auth-box').classList.remove('hidden');
        document.getElementById('admin-dashboard').classList.add('hidden');
      }
    } else if (sectionId === 'status' && this.currentUser) {
      this.handleStatusLookup(null, this.currentUser.phone);
    }
  },

  async loadVerifiedDesks() {
    try {
      this.verifiedDesks = await API.getDesks();
      this.renderDesksOnHome();
      this.populateDeskDropdowns();
    } catch (err) {
      console.error('Failed to load desks:', err);
    }
  },

  renderDesksOnHome() {
    const grid = document.getElementById('home-desks-grid');
    if (!grid) return;

    if (!this.verifiedDesks.length) {
      grid.innerHTML = '<p class="text-muted">No verified partner desks currently configured.</p>';
      return;
    }

    grid.innerHTML = this.verifiedDesks.map(desk => `
      <div class="desk-card">
        <span class="badge badge-verified">Official Partner Desk</span>
        <div class="desk-card-title">${this.escapeHtml(desk.name)}</div>
        <div class="desk-card-zone">${this.escapeHtml(desk.building_or_zone)} • ${this.escapeHtml(desk.address)}</div>
        <div class="desk-card-hours">⏰ Operating: ${this.escapeHtml(desk.operating_hours)}</div>
        <div class="desk-card-officer">Staff Duty: ${this.escapeHtml(desk.officer_on_duty)} (${this.escapeHtml(desk.contact_phone)})</div>
      </div>
    `).join('');
  },

  populateDeskDropdowns() {
    const select = document.getElementById('found-desk-select');
    const termSelect = document.getElementById('handover-desk-select');

    const optionsHtml = this.verifiedDesks.map(d => 
      `<option value="${d.id}">${this.escapeHtml(d.name)} (${this.escapeHtml(d.building_or_zone)})</option>`
    ).join('');

    if (select) {
      select.innerHTML = '<option value="">-- Choose an Official Custody Desk --</option>' + optionsHtml;
    }
    if (termSelect) {
      termSelect.innerHTML = optionsHtml;
    }
  },

  handleDeskChange(e) {
    const deskId = e.target.value;
    const infoBox = document.getElementById('selected-desk-info');
    if (!infoBox) return;

    if (!deskId) {
      infoBox.classList.add('hidden');
      return;
    }

    const desk = this.verifiedDesks.find(d => d.id === deskId);
    if (!desk) return;

    infoBox.innerHTML = `
      <strong>${this.escapeHtml(desk.name)}</strong><br/>
      <span>${this.escapeHtml(desk.building_or_zone)} • ${this.escapeHtml(desk.address)}</span><br/>
      <span>⏰ ${this.escapeHtml(desk.operating_hours)} | Officer on Duty: ${this.escapeHtml(desk.officer_on_duty)}</span>
    `;
    infoBox.classList.remove('hidden');
  },

  switchFoundMode(mode) {
    const optDesk = document.getElementById('mode-opt-desk');
    const optDirect = document.getElementById('mode-opt-direct');
    const formDesk = document.getElementById('found-desk-form');
    const formDirect = document.getElementById('found-direct-form');

    if (mode === 'desk') {
      optDesk.classList.add('active');
      optDirect.classList.remove('active');
      formDesk.classList.remove('hidden');
      formDirect.classList.add('hidden');
    } else {
      optDirect.classList.add('active');
      optDesk.classList.remove('active');
      formDirect.classList.remove('hidden');
      formDesk.classList.add('hidden');
    }
  },

  // --------------------------------------------------------------------------
  // Geolocation & Photos
  // --------------------------------------------------------------------------
  detectCurrentGPS(target) {
    if (!navigator.geolocation) {
      this.showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    this.showToast('Detecting current GPS coordinates...', 'info');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);

        if (target === 'lost') {
          document.getElementById('lost-lat').value = lat;
          document.getElementById('lost-lon').value = lon;
        } else if (target === 'direct') {
          document.getElementById('found-direct-lat').value = lat;
          document.getElementById('found-direct-lon').value = lon;
        }
        this.showToast(`GPS captured: ${lat}, ${lon}`, 'success');
      },
      err => {
        this.showToast('Could not acquire precise GPS. Standard coordinates retained.', 'info');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  },

  handleSinglePhoto(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const dataUrl = evt.target.result;
      if (type === 'desk') {
        this.foundDeskPhoto = dataUrl;
        document.getElementById('found-desk-photo-name').textContent = file.name;
        document.getElementById('found-desk-photo-preview').innerHTML = `<img src="${dataUrl}" alt="Preview" style="max-height:120px; border-radius:var(--radius-sm); border:1px solid var(--border-light); margin-top:0.5rem;" />`;
      } else if (type === 'direct-primary') {
        this.foundDirectPrimaryPhoto = dataUrl;
        document.getElementById('found-direct-primary-name').textContent = file.name;
        document.getElementById('found-direct-primary-preview').innerHTML = `<img src="${dataUrl}" alt="Preview" style="max-height:120px; border-radius:var(--radius-sm); border:1px solid var(--border-light); margin-top:0.5rem;" />`;
      }
    };
    reader.readAsDataURL(file);
  },

  handleExtraPhotos(e) {
    const files = Array.from(e.target.files).slice(0, 4);
    this.foundDirectExtraPhotos = [];
    const previewContainer = document.getElementById('found-direct-extra-preview');
    previewContainer.innerHTML = '';

    document.getElementById('found-direct-extra-count').textContent = `${files.length} extra photo(s)`;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = evt => {
        const dataUrl = evt.target.result;
        this.foundDirectExtraPhotos.push(dataUrl);
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.maxHeight = '90px';
        img.style.borderRadius = 'var(--radius-sm)';
        img.style.border = '1px solid var(--border-light)';
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  },

  handleLostPhotos(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    this.lostRefPhotos = [];
    const preview = document.getElementById('lost-photos-preview');
    preview.innerHTML = '';

    document.getElementById('lost-photos-count').textContent = `${files.length} photo(s)`;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = evt => {
        const dataUrl = evt.target.result;
        this.lostRefPhotos.push(dataUrl);
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.maxHeight = '90px';
        img.style.borderRadius = 'var(--radius-sm)';
        img.style.border = '1px solid var(--border-light)';
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  },

  // --------------------------------------------------------------------------
  // Secret Identification Points
  // --------------------------------------------------------------------------
  initSecretPoints() {
    this.secretPoints = [];
    this.addSecretPoint();
  },

  addSecretPoint() {
    if (this.secretPoints.length >= 3) {
      this.showToast('Maximum of 3 secret identification points reached.', 'info');
      return;
    }

    const index = this.secretPoints.length;
    this.secretPoints.push({ point: '', photo_url: null });
    this.renderSecretPoints();
  },

  removeSecretPoint(index) {
    if (this.secretPoints.length <= 1) {
      this.showToast('At least 1 secret identification flaw is required for verification.', 'info');
      return;
    }
    this.secretPoints.splice(index, 1);
    this.renderSecretPoints();
  },

  renderSecretPoints() {
    const container = document.getElementById('secret-points-container');
    if (!container) return;

    container.innerHTML = this.secretPoints.map((sp, idx) => `
      <div class="secret-point-item" style="background:#ffffff; border:1px solid var(--border-light); padding:1rem; border-radius:var(--radius-sm); margin-bottom:0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <strong style="font-size:0.85rem; color:#78350f;">Secret Feature #${idx + 1}</strong>
          ${this.secretPoints.length > 1 ? `<button type="button" class="btn btn-outline btn-sm" style="padding:0.15rem 0.4rem; font-size:0.75rem;" onclick="app.removeSecretPoint(${idx})">✕ Remove</button>` : ''}
        </div>
        <div class="form-group" style="margin-bottom:0.5rem;">
          <input 
            type="text" 
            class="form-control" 
            id="secret-point-text-${idx}" 
            placeholder="e.g. Small hairline crack on the right hinge near the power button" 
            value="${this.escapeHtml(sp.point)}" 
            onchange="app.updateSecretPointText(${idx}, this.value)"
            required 
          />
        </div>
      </div>
    `).join('');

    const addBtn = document.getElementById('btn-add-secret');
    if (addBtn) {
      addBtn.style.display = this.secretPoints.length >= 3 ? 'none' : 'inline-flex';
    }
  },

  updateSecretPointText(index, text) {
    if (this.secretPoints[index]) {
      this.secretPoints[index].point = text;
    }
  },

  // --------------------------------------------------------------------------
  // OTP Verification Simulation
  // --------------------------------------------------------------------------
  async handleSendOTP(type) {
    const phone = document.getElementById('lost-owner-phone').value.trim();
    if (!phone || phone.length < 7) {
      this.showToast('Please enter a valid phone number first', 'error');
      return;
    }

    try {
      const res = await API.sendOTP(phone);
      const otpBox = document.getElementById('lost-otp-box');
      if (otpBox) otpBox.classList.remove('hidden');

      const codeInput = document.getElementById('lost-otp-code');
      if (codeInput && res.debug_code) {
        codeInput.value = res.debug_code;
      }
      this.showToast(`Verification OTP sent: ${res.debug_code}`, 'success');
    } catch (err) {
      this.showToast(err.message || 'Failed to send OTP', 'error');
    }
  },

  async handleVerifyOTP(type) {
    const phone = document.getElementById('lost-owner-phone').value.trim();
    const code = document.getElementById('lost-otp-code').value.trim();

    try {
      await API.verifyOTP(phone, code);
      document.getElementById('lost-otp-box').classList.add('hidden');
      document.getElementById('lost-phone-verified-badge').classList.remove('hidden');
      document.getElementById('btn-lost-send-otp').classList.add('hidden');
      this.showToast('Phone number verified successfully!', 'success');
    } catch (err) {
      this.showToast(err.message || 'Invalid OTP', 'error');
    }
  },

  // --------------------------------------------------------------------------
  // Lost Item Submission
  // --------------------------------------------------------------------------
  async handleLostSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('lost-product-name').value.trim();
    const category = document.getElementById('lost-category').value;
    const description = document.getElementById('lost-description').value.trim();
    const rewardAmount = parseFloat(document.getElementById('lost-reward-amount').value || '0');
    const rewardCurrency = document.getElementById('lost-reward-currency').value;
    const location = document.getElementById('lost-location').value.trim();
    const datetime = document.getElementById('lost-datetime').value;
    const lat = parseFloat(document.getElementById('lost-lat').value);
    const lon = parseFloat(document.getElementById('lost-lon').value);
    const ownerName = document.getElementById('lost-owner-name').value.trim();
    const ownerPhone = document.getElementById('lost-owner-phone').value.trim();
    const backupContact = document.getElementById('lost-backup-contact').value.trim();
    const ownerEmail = document.getElementById('lost-owner-email').value.trim();
    const instId = document.getElementById('lost-inst-id').value.trim();
    const address = document.getElementById('lost-address').value.trim();

    // Verify secret points
    const validSecretPoints = this.secretPoints
      .map((sp, idx) => {
        const textElem = document.getElementById(`secret-point-text-${idx}`);
        const textVal = textElem ? textElem.value.trim() : sp.point.trim();
        return { point: textVal, photo_url: sp.photo_url };
      })
      .filter(sp => sp.point.length > 2);

    if (!validSecretPoints.length) {
      this.showToast('Please provide at least 1 confidential secret flaw.', 'error');
      return;
    }

    if (!backupContact) {
      this.showToast('The Lost-Phone Catch-22 Rule requires a mandatory Backup Contact.', 'error');
      return;
    }

    const payload = {
      product_name: name,
      category,
      description,
      reference_photos: this.lostRefPhotos,
      secret_points: validSecretPoints,
      reward_amount: rewardAmount,
      reward_currency: rewardCurrency,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      backup_contact: backupContact,
      owner_email: ownerEmail,
      residential_address: address,
      institutional_id: instId,
      last_seen_location: location,
      latitude: lat,
      longitude: lon,
      last_seen_time: datetime,
      user_id: this.currentUser ? this.currentUser.id : null
    };

    const submitBtn = document.getElementById('btn-submit-lost');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering & Pledging Escrow...';

    try {
      const res = await API.createLostItem(payload);
      this.showToast('Lost item registered! Escrow locked.', 'success');
      this.latestLostItemId = res.id;

      this.openModal('Lost Item Registration Receipt', `
        <div class="handover-receipt-box">
          <div class="handover-receipt-header">
            <div>
              <span class="badge badge-lost">Report Filed</span>
              <h3 style="margin-top:0.3rem;">${this.escapeHtml(res.product_name)}</h3>
            </div>
            <span class="passcode-pill">${res.id}</span>
          </div>
          <div class="handover-details-grid">
            <div><strong>Owner:</strong> ${this.escapeHtml(res.owner_name)} (${res.owner_phone})</div>
            <div><strong>Backup Contact:</strong> ${this.escapeHtml(res.backup_contact)}</div>
            <div><strong>Govt ID Last 4:</strong> ${res.govt_id_last4}</div>
            <div><strong>Escrow Status:</strong> <span class="badge badge-escrow">${res.escrow_status} (${res.reward_currency} ${res.reward_amount})</span></div>
            <div><strong>Tracking Token:</strong> <code>${res.access_token}</code></div>
            <div><strong>Location:</strong> ${this.escapeHtml(res.last_seen_location)}</div>
          </div>
          <p style="font-size:0.85rem; color:#475569; margin-top:1rem;">
            🛡️ <strong>Double-Blind Protection:</strong> Your secret flaws are securely stored and will only be used to autonomously challenge matching finders without leaking the flaw.
          </p>
        </div>
      `);

      document.getElementById('lost-item-form').reset();
      this.lostRefPhotos = [];
      this.initSecretPoints();
    } catch (err) {
      this.showToast(err.message || 'Failed to submit lost item', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register Lost Report & Lock Escrow';
    }
  },

  // --------------------------------------------------------------------------
  // Found Item Submissions (Desk vs Direct)
  // --------------------------------------------------------------------------
  async handleFoundDeskSubmit(e) {
    e.preventDefault();
    const deskId = document.getElementById('found-desk-select').value;
    const name = document.getElementById('found-desk-object-name').value.trim();
    const category = document.getElementById('found-desk-category').value;
    const description = document.getElementById('found-desk-desc').value.trim();
    const finderName = document.getElementById('found-desk-finder-name').value.trim();
    const finderPhone = document.getElementById('found-desk-finder-phone').value.trim();
    const finderEmail = document.getElementById('found-desk-finder-email').value.trim();
    const upiId = document.getElementById('found-desk-upi').value.trim();
    const rollId = document.getElementById('found-desk-roll').value.trim();

    if (!this.foundDeskPhoto) {
      this.showToast('Please upload a mandatory photo of the found item.', 'error');
      return;
    }

    const payload = {
      desk_id: deskId,
      object_name: name,
      category,
      description,
      primary_photo: this.foundDeskPhoto,
      additional_photos: [],
      finder_name: finderName,
      finder_phone: finderPhone,
      finder_email: finderEmail,
      finder_upi_id: upiId,
      finder_roll_or_id: rollId || null,
      user_id: this.currentUser ? this.currentUser.id : null
    };

    const submitBtn = document.getElementById('btn-submit-found-desk');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Depositing with Desk Officer...';

    try {
      const res = await API.createDeskFoundItem(payload);
      this.showToast('Desk intake successful! Digital receipt generated.', 'success');

      this.openModal('Official Desk Custody Receipt', `
        <div class="handover-receipt-box">
          <div class="handover-receipt-header">
            <div>
              <span class="badge badge-verified">Official Desk Deposit</span>
              <h3 style="margin-top:0.3rem;">Receipt #${res.desk_intake_receipt_id}</h3>
            </div>
            <span class="passcode-pill">${res.id}</span>
          </div>
          <div class="handover-details-grid">
            <div><strong>Item Deposited:</strong> ${this.escapeHtml(res.object_name)}</div>
            <div><strong>Category:</strong> ${this.escapeHtml(res.category)}</div>
            <div><strong>Finder Samaritan:</strong> ${this.escapeHtml(res.finder_name)} (${res.finder_phone})</div>
            <div><strong>Payout UPI:</strong> <code>${this.escapeHtml(res.finder_upi_id)}</code></div>
            <div><strong>Deposit Desk:</strong> ${this.escapeHtml(res.found_location)}</div>
            <div><strong>Custody Status:</strong> <span class="badge badge-verified">IN_CUSTODY</span></div>
          </div>
          <div style="margin-top:1rem; text-align:center;">
            <img src="${res.primary_photo}" alt="Found Item" style="max-height:160px; border-radius:var(--radius-sm); border:1px solid var(--border-light);" />
          </div>
        </div>
      `);

      document.getElementById('found-desk-form').reset();
      this.foundDeskPhoto = null;
      document.getElementById('found-desk-photo-preview').innerHTML = '';
      document.getElementById('found-desk-photo-name').textContent = 'Required';
    } catch (err) {
      this.showToast(err.message || 'Failed to submit desk found item', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate Desk Intake Receipt';
    }
  },

  async handleFoundDirectSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('found-direct-object-name').value.trim();
    const category = document.getElementById('found-direct-category').value;
    const description = document.getElementById('found-direct-desc').value.trim();
    const location = document.getElementById('found-direct-location').value.trim();
    const datetime = document.getElementById('found-direct-datetime').value;
    const lat = parseFloat(document.getElementById('found-direct-lat').value);
    const lon = parseFloat(document.getElementById('found-direct-lon').value);
    const handoverPref = document.getElementById('found-direct-handover-pref').value.trim();
    const finderName = document.getElementById('found-direct-finder-name').value.trim();
    const finderPhone = document.getElementById('found-direct-finder-phone').value.trim();
    const finderEmail = document.getElementById('found-direct-finder-email').value.trim();
    const upiId = document.getElementById('found-direct-upi').value.trim();
    const rollId = document.getElementById('found-direct-roll').value.trim();

    if (!this.foundDirectPrimaryPhoto) {
      this.showToast('Please upload a mandatory primary photo of the item.', 'error');
      return;
    }

    const payload = {
      object_name: name,
      category,
      description,
      primary_photo: this.foundDirectPrimaryPhoto,
      additional_photos: this.foundDirectExtraPhotos,
      found_location: location,
      latitude: lat,
      longitude: lon,
      found_time: datetime,
      pickup_availability: handoverPref,
      finder_name: finderName,
      finder_phone: finderPhone,
      finder_email: finderEmail,
      finder_upi_id: upiId,
      finder_roll_or_id: rollId || null,
      user_id: this.currentUser ? this.currentUser.id : null
    };

    const submitBtn = document.getElementById('btn-submit-found-direct');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering Direct Custody...';

    try {
      const res = await API.createDirectFoundItem(payload);
      this.showToast('Item registered in direct custody!', 'success');

      this.openModal('Direct Custody Intake Confirmation', `
        <div class="handover-receipt-box">
          <div class="handover-receipt-header">
            <div>
              <span class="badge badge-found">Direct Custody Logged</span>
              <h3 style="margin-top:0.3rem;">${this.escapeHtml(res.object_name)}</h3>
            </div>
            <span class="passcode-pill">${res.id}</span>
          </div>
          <div class="handover-details-grid">
            <div><strong>Location Found:</strong> ${this.escapeHtml(res.found_location)}</div>
            <div><strong>Handover Availability:</strong> ${this.escapeHtml(res.pickup_availability)}</div>
            <div><strong>Finder Samaritan:</strong> ${this.escapeHtml(res.finder_name)} (${res.finder_phone})</div>
            <div><strong>Payout UPI:</strong> <code>${this.escapeHtml(res.finder_upi_id)}</code></div>
            <div><strong>Tracking Token:</strong> <code>${res.access_token}</code></div>
            <div><strong>Status:</strong> <span class="badge badge-found">IN_CUSTODY</span></div>
          </div>
          <p style="font-size:0.85rem; color:#475569; margin-top:1rem;">
            Keep this item safe. You will receive an alert if the AI matching engine detects the owner or dispatches a blind verification probe.
          </p>
        </div>
      `);

      document.getElementById('found-direct-form').reset();
      this.foundDirectPrimaryPhoto = null;
      this.foundDirectExtraPhotos = [];
      document.getElementById('found-direct-primary-preview').innerHTML = '';
      document.getElementById('found-direct-extra-preview').innerHTML = '';
    } catch (err) {
      this.showToast(err.message || 'Failed to submit direct found item', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Found Item Record';
    }
  },

  // --------------------------------------------------------------------------
  // User Status & Dashboard Tracking
  // --------------------------------------------------------------------------
  handleQuickTrack(e) {
    e.preventDefault();
    const query = document.getElementById('quick-track-input').value.trim();
    if (!query) return;
    this.showSection('status');
    const statusInput = document.getElementById('status-lookup-input');
    if (statusInput) statusInput.value = query;
    this.handleStatusLookup(null, query);
  },

  async handleStatusLookup(e, explicitQuery = null) {
    if (e) e.preventDefault();
    const query = explicitQuery || document.getElementById('status-lookup-input').value.trim();
    if (!query) {
      this.showToast('Please enter a phone number or tracking token', 'error');
      return;
    }

    const container = document.getElementById('status-results');
    container.innerHTML = '<div class="loading-placeholder">Searching double-blind secure records...</div>';
    container.classList.remove('hidden');

    try {
      const res = await API.lookupStatus(query);
      this.renderStatusResults(res);
    } catch (err) {
      container.innerHTML = `
        <div style="background:#ffffff; padding:2rem; border-radius:var(--radius-md); border:1px solid var(--border-light); text-align:center;">
          <p style="color:var(--color-rose); font-weight:600;">No records found for "${this.escapeHtml(query)}"</p>
          <p class="field-hint" style="margin-top:0.5rem;">Check that you entered the exact phone number used in the report, or click "⚡ Load Demo Dataset" to test with Aarav's phone: <code>+91 98765 43210</code>.</p>
        </div>
      `;
    }
  },

  renderStatusResults(data) {
    const container = document.getElementById('status-results');
    let html = '';

    // 1. Lost Items
    if (data.lost_items && data.lost_items.length > 0) {
      html += `<h2 style="font-size:1.25rem; font-weight:700; margin-bottom:1rem;">Your Reported Lost Property (${data.lost_items.length})</h2>`;
      
      data.lost_items.forEach(item => {
        const isResolved = item.status === 'RESOLVED';
        const isReady = item.status === 'READY_FOR_HANDOVER';
        const isVerifying = item.status === 'VERIFYING';

        html += `
          <div class="status-timeline-card" style="background:#ffffff; border:1px solid var(--border-light); border-radius:var(--radius-md); padding:1.5rem; margin-bottom:1.5rem; box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <span class="badge ${isResolved ? 'badge-verified' : 'badge-lost'}">${item.status}</span>
                <h3 style="font-size:1.2rem; margin-top:0.3rem;">${this.escapeHtml(item.product_name)}</h3>
                <span class="field-hint">Report ID: ${item.id} • Registered: ${new Date(item.created_at).toLocaleString()}</span>
              </div>
              <div style="text-align:right;">
                <span class="badge badge-escrow">${item.escrow_status}: ${item.reward_currency} ${item.reward_amount}</span>
              </div>
            </div>

            <!-- Visual Status Timeline -->
            <div style="display:flex; justify-content:space-between; margin:1.5rem 0; position:relative;">
              <div style="text-align:center; flex:1;">
                <div style="width:28px; height:28px; border-radius:50%; background:#059669; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 0.3rem; font-weight:700; font-size:0.8rem;">✓</div>
                <span style="font-size:0.75rem; font-weight:600;">1. Intake Logged</span>
              </div>
              <div style="text-align:center; flex:1;">
                <div style="width:28px; height:28px; border-radius:50%; background:${item.status !== 'REPORTED' ? '#059669' : '#18181b'}; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 0.3rem; font-weight:700; font-size:0.8rem;">${item.status !== 'REPORTED' ? '✓' : '2'}</div>
                <span style="font-size:0.75rem; font-weight:600;">2. Vector & Geo Match</span>
              </div>
              <div style="text-align:center; flex:1;">
                <div style="width:28px; height:28px; border-radius:50%; background:${isVerifying || isReady || isResolved ? '#059669' : '#e2e8f0'}; color:${isVerifying || isReady || isResolved ? '#fff' : '#64748b'}; display:flex; align-items:center; justify-content:center; margin:0 auto 0.3rem; font-weight:700; font-size:0.8rem;">${isReady || isResolved ? '✓' : '3'}</div>
                <span style="font-size:0.75rem; font-weight:600;">3. Blind Probe Check</span>
              </div>
              <div style="text-align:center; flex:1;">
                <div style="width:28px; height:28px; border-radius:50%; background:${isResolved ? '#059669' : (isReady ? '#f59e0b' : '#e2e8f0')}; color:${isReady || isResolved ? '#fff' : '#64748b'}; display:flex; align-items:center; justify-content:center; margin:0 auto 0.3rem; font-weight:700; font-size:0.8rem;">${isResolved ? '✓' : '4'}</div>
                <span style="font-size:0.75rem; font-weight:600;">4. Handover & Escrow</span>
              </div>
            </div>

            <!-- Dynamic Passcode Card for Claimant -->
            ${item.active_passcode ? `
              <div style="background:#f0fdf4; border:2px solid #86efac; border-radius:var(--radius-sm); padding:1.25rem; text-align:center; margin-top:1rem;">
                <span class="badge badge-verified">Ready for Physical Pickup</span>
                <h4 style="margin:0.5rem 0; font-size:1.1rem; color:#166534;">Your 6-Digit Physical Handover Passcode</h4>
                <div style="font-size:2.2rem; font-weight:800; letter-spacing:0.3em; font-family:ui-monospace, monospace; color:#18181b; margin:0.5rem 0;">
                  ${item.active_passcode}
                </div>
                <p class="field-hint" style="color:#15803d;">
                  Present this 6-digit code to the duty officer at the verified custody desk to collect your item. The officer will verify it to complete recovery and disburse the escrow reward.
                </p>
              </div>
            ` : ''}

            <div style="font-size:0.85rem; color:#475569; margin-top:0.75rem;">
              <strong>Backup Contact on file:</strong> ${this.escapeHtml(item.backup_contact)} • 
              <strong>Last seen:</strong> ${this.escapeHtml(item.last_seen_location)}
            </div>
          </div>
        `;
      });
    }

    // 2. Found Items & Pending Blind Probes
    if (data.found_items && data.found_items.length > 0) {
      html += `<h2 style="font-size:1.25rem; font-weight:700; margin:2rem 0 1rem 0;">Your Submitted Found Property (${data.found_items.length})</h2>`;

      data.found_items.forEach(item => {
        const hasPendingProbe = item.pending_probes && item.pending_probes.some(p => p.probe_status === 'PENDING_RESPONSE');

        html += `
          <div class="status-timeline-card" style="background:#ffffff; border:1px solid var(--border-light); border-radius:var(--radius-md); padding:1.5rem; margin-bottom:1.5rem; box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <span class="badge badge-found">${item.status}</span>
                ${item.is_verified_samaritan ? '<span class="badge badge-verified">Verified Samaritan</span>' : ''}
                <h3 style="font-size:1.2rem; margin-top:0.3rem;">${this.escapeHtml(item.object_name)}</h3>
                <span class="field-hint">Found ID: ${item.id} ${item.desk_intake_receipt_id ? `• Receipt: ${item.desk_intake_receipt_id}` : ''} • Payout UPI: <code>${this.escapeHtml(item.finder_upi_id)}</code></span>
              </div>
              <div style="text-align:right;">
                <span class="badge badge-neutral">${item.submission_type}</span>
              </div>
            </div>

            <!-- Pending Autonomous Blind Verification Probe Challenge -->
            ${hasPendingProbe ? `
              <div style="background:#fffbeb; border:2px solid #fde68a; border-radius:var(--radius-sm); padding:1.25rem; margin:1rem 0;">
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                  <span class="badge badge-escrow">Action Required</span>
                  <strong style="color:#92400e;">Autonomous AI Blind Verification Challenge</strong>
                </div>
                ${item.pending_probes.filter(p => p.probe_status === 'PENDING_RESPONSE').map(probe => `
                  <div style="margin-top:0.75rem;">
                    <p style="font-size:0.95rem; font-weight:600; color:#78350f; margin-bottom:0.5rem;">
                      "${this.escapeHtml(probe.neutral_prompt)}"
                    </p>
                    <p class="field-hint" style="color:#b45309; margin-bottom:0.75rem;">
                      Target Zone: <strong>${this.escapeHtml(probe.target_area)}</strong>. (The system does not tell you what flaw or mark is there — only photograph the designated area clearly.)
                    </p>
                    <div style="display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap;">
                      <input type="file" id="probe-file-${probe.id}" accept="image/*" style="display:none;" onchange="app.handleProbeFileSelect('${probe.id}', event)" />
                      <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('probe-file-${probe.id}').click()">
                        📷 Capture / Upload Close-Up Photo
                      </button>
                      <button type="button" class="btn btn-outline btn-sm" onclick="app.useDemoHingePhoto('${probe.id}')">
                        ⚡ Use Demo Hinge Verification Photo
                      </button>
                      <span id="probe-file-name-${probe.id}" class="field-hint"></span>
                    </div>
                    <div id="probe-preview-${probe.id}" style="margin-top:0.5rem;"></div>
                    <div style="margin-top:0.75rem;">
                      <input type="text" id="probe-notes-${probe.id}" class="form-control form-control-sm" placeholder="Optional notes for the AI verifier (e.g., Captured under direct light)" />
                    </div>
                    <button type="button" class="btn btn-success btn-sm" style="margin-top:0.75rem;" onclick="app.submitProbeResponse('${probe.id}')">
                      Submit Verification Photo
                    </button>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Verified Probes History -->
            ${item.pending_probes && item.pending_probes.some(p => p.probe_status === 'VERIFIED') ? `
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:var(--radius-sm); padding:1rem; margin-top:0.75rem;">
                <span class="badge badge-verified">✓ Probe Verified</span>
                <span style="font-size:0.85rem; color:#166534; font-weight:600; margin-left:0.5rem;">Target feature successfully matched owner's proof! Handover authorized.</span>
              </div>
            ` : ''}

            <div style="font-size:0.85rem; color:#475569; margin-top:0.75rem;">
              <strong>Found at:</strong> ${this.escapeHtml(item.found_location)} • 
              <strong>Availability:</strong> ${this.escapeHtml(item.pickup_availability)}
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;
  },

  handleProbeFileSelect(probeId, e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const dataUrl = evt.target.result;
      document.getElementById(`probe-file-name-${probeId}`).textContent = file.name;
      document.getElementById(`probe-preview-${probeId}`).innerHTML = `<img src="${dataUrl}" alt="Probe Preview" style="max-height:120px; border-radius:var(--radius-sm); border:1px solid var(--border-light);" />`;
      this[`probe_data_${probeId}`] = dataUrl;
    };
    reader.readAsDataURL(file);
  },

  useDemoHingePhoto(probeId) {
    // Provide built-in realistic SVG close-up photo for instantaneous 1-click testing
    const demoSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%2318181b'/><rect x='50' y='120' width='500' height='160' rx='6' fill='%2327272a' stroke='%233f3f46' stroke-width='2'/><line x1='350' y1='120' x2='350' y2='280' stroke='%2352525b' stroke-width='8'/><circle cx='440' cy='160' r='14' fill='%2318181b' stroke='%2371717a' stroke-width='2'/><path d='M360 162 L390 178' stroke='%23ef4444' stroke-width='2' stroke-dasharray='2,2'/><text x='300' y='70' font-family='sans-serif' font-size='15' font-weight='bold' fill='%23f43f5e' text-anchor='middle'>Close-Up Inspection: Right Hinge &amp; Power Button Zone</text><text x='400' y='210' font-family='sans-serif' font-size='13' fill='%23fbbf24'>Hairline crack visible</text></svg>";
    this[`probe_data_${probeId}`] = demoSvg;
    document.getElementById(`probe-file-name-${probeId}`).textContent = 'demo_hinge_closeup.svg';
    document.getElementById(`probe-preview-${probeId}`).innerHTML = `<img src="${demoSvg}" alt="Probe Preview" style="max-height:120px; border-radius:var(--radius-sm); border:1px solid var(--border-light);" />`;
    document.getElementById(`probe-notes-${probeId}`).value = 'High-resolution photo showing right hinge near power button.';
    this.showToast('Demo close-up photo loaded', 'info');
  },

  async submitProbeResponse(probeId) {
    const photoData = this[`probe_data_${probeId}`];
    if (!photoData) {
      this.showToast('Please select or upload a close-up verification photo first', 'error');
      return;
    }
    const notes = document.getElementById(`probe-notes-${probeId}`).value.trim();

    this.showToast('AI Verification Agent evaluating photo...', 'info');

    try {
      const res = await API.submitProbeResponse(probeId, photoData, notes);
      this.showToast(`Probe evaluated: ${res.probe_status} (${Math.round(res.agent_verification_score * 100)}% Confidence)`, 'success');
      alert(`AI Agent Verification Report:\n\nStatus: ${res.probe_status}\nConfidence Score: ${Math.round(res.agent_verification_score * 100)}%\nReasoning: ${res.agent_analysis_reasoning}`);
      
      const query = document.getElementById('status-lookup-input').value.trim();
      this.handleStatusLookup(null, query);
    } catch (err) {
      this.showToast(err.message || 'Failed to submit probe response', 'error');
    }
  },

  // --------------------------------------------------------------------------
  // Admin Portal & 5-Stage Animated Matching Pipeline
  // --------------------------------------------------------------------------
  handleAdminLogin(e) {
    e.preventDefault();
    const pin = document.getElementById('admin-pin-input').value.trim();
    if (pin === 'admin123') {
      this.adminPin = pin;
      localStorage.setItem('aegis_admin_pin', pin);
      document.getElementById('admin-auth-box').classList.add('hidden');
      document.getElementById('admin-dashboard').classList.remove('hidden');
      this.showToast('Admin access granted', 'success');
      this.refreshAdminData();
    } else {
      this.showToast('Invalid Admin PIN (Default: admin123)', 'error');
    }
  },

  adminLogout() {
    this.adminPin = null;
    localStorage.removeItem('aegis_admin_pin');
    document.getElementById('admin-auth-box').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    this.showToast('Admin session ended', 'info');
  },

  switchAdminTab(tab) {
    this.activeAdminTab = tab;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.add('hidden'));

    const activeBtn = document.getElementById(`atab-${tab}`);
    const activePanel = document.getElementById(`admin-panel-${tab}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.remove('hidden');
  },

  async refreshAdminData() {
    if (!this.adminPin) return;

    try {
      const [lost, found, escrows] = await Promise.all([
        API.getAdminLostItems(this.adminPin),
        API.getAdminFoundItems(this.adminPin),
        API.getAdminEscrowRecords(this.adminPin)
      ]);

      this.renderAdminLostItems(lost);
      this.renderAdminFoundItems(found);
      this.renderAdminEscrow(escrows);
      this.renderAdminDesks();
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    }
  },

  renderAdminLostItems(items) {
    document.getElementById('admin-lost-count').textContent = `${items.length} records`;
    const container = document.getElementById('admin-lost-list');

    if (!items.length) {
      container.innerHTML = '<p class="text-muted" style="padding:1.5rem; text-align:center;">No lost items reported yet. Click "⚡ Reload Demo Data" to load test items.</p>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Item Details</th>
            <th>Category</th>
            <th>Owner & Contacts</th>
            <th>Escrow Reward</th>
            <th>Status</th>
            <th>5-Stage AI Engine</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>
                <strong>${this.escapeHtml(item.product_name)}</strong><br/>
                <span class="field-hint">ID: ${item.id}</span>
              </td>
              <td>${this.escapeHtml(item.category)}</td>
              <td>
                ${this.escapeHtml(item.owner_name)} (${item.owner_phone})<br/>
                <span class="field-hint">Backup: ${this.escapeHtml(item.backup_contact)}</span>
              </td>
              <td>
                <span class="badge badge-escrow">${item.reward_currency} ${item.reward_amount}</span>
              </td>
              <td>
                <span class="badge ${item.status === 'RESOLVED' ? 'badge-verified' : 'badge-lost'}">${item.status}</span>
              </td>
              <td>
                <button class="btn btn-primary btn-sm" onclick="app.runMatchEngine('${item.id}')">
                  ⚡ Run 5-Stage Matching Engine
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  renderAdminFoundItems(items) {
    document.getElementById('admin-found-count').textContent = `${items.length} records`;
    const container = document.getElementById('admin-found-list');

    if (!items.length) {
      container.innerHTML = '<p class="text-muted" style="padding:1.5rem; text-align:center;">No found items registered yet.</p>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Item & Receipt</th>
            <th>Type</th>
            <th>Finder & UPI</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="width:70px;">
                <img src="${item.primary_photo}" alt="Item" style="width:60px; height:45px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--border-light);" />
              </td>
              <td>
                <strong>${this.escapeHtml(item.object_name)}</strong><br/>
                <span class="field-hint">${item.desk_intake_receipt_id ? `Receipt: ${item.desk_intake_receipt_id}` : item.id}</span>
              </td>
              <td><span class="badge badge-neutral">${item.submission_type}</span></td>
              <td>
                ${this.escapeHtml(item.finder_name)} (${item.finder_phone})<br/>
                <code>${this.escapeHtml(item.finder_upi_id)}</code>
              </td>
              <td>${this.escapeHtml(item.found_location)}</td>
              <td>
                <span class="badge ${item.status === 'RESOLVED' ? 'badge-verified' : 'badge-found'}">${item.status}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  renderAdminEscrow(records) {
    document.getElementById('admin-escrow-count').textContent = `${records.length} records`;
    const container = document.getElementById('admin-escrow-list');

    if (!records.length) {
      container.innerHTML = '<p class="text-muted" style="padding:1.5rem; text-align:center;">No escrow records registered.</p>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Txn Reference</th>
            <th>Lost Item</th>
            <th>Payer</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Recipient UPI</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr>
              <td><code>${r.transaction_ref}</code></td>
              <td>${r.lost_item_id}</td>
              <td>${this.escapeHtml(r.payer_name)} (${r.payer_phone})</td>
              <td><strong>${r.currency} ${r.amount}</strong></td>
              <td><span class="badge ${r.status === 'DISBURSED' ? 'badge-verified' : 'badge-escrow'}">${r.status}</span></td>
              <td><code>${r.recipient_upi || 'Pending verified match'}</code></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  renderAdminDesks() {
    const container = document.getElementById('admin-desks-list');
    if (!container) return;

    container.innerHTML = this.verifiedDesks.map(desk => `
      <div class="desk-card">
        <span class="badge badge-verified">Verified Desk ID: ${desk.id}</span>
        <div class="desk-card-title">${this.escapeHtml(desk.name)}</div>
        <div class="desk-card-zone">${this.escapeHtml(desk.building_or_zone)} • ${this.escapeHtml(desk.address)}</div>
        <div class="desk-card-hours">⏰ Operating: ${this.escapeHtml(desk.operating_hours)}</div>
        <div class="desk-card-officer">Officer on Duty: ${this.escapeHtml(desk.officer_on_duty)} (${desk.contact_phone})</div>
      </div>
    `).join('');
  },

  // --------------------------------------------------------------------------
  // 5-STAGE ANIMATED MATCHING PIPELINE MODAL
  // --------------------------------------------------------------------------
  async runMatchEngine(lostItemId) {
    this.latestLostItemId = lostItemId;

    // Open modal with initial Stepped Pipeline Animation structure
    this.openModal('5-Stage AI Matching Pipeline Execution', `
      <div class="pipeline-modal-container">
        <!-- Visual Stepper Bar -->
        <div class="pipeline-stepper">
          <div class="pipeline-track">
            <div id="pipeline-progress" class="pipeline-track-progress"></div>
          </div>
          <div id="step-node-1" class="pipeline-step-node active">
            <div class="pipeline-node-icon" id="icon-node-1">1</div>
            <span class="pipeline-node-title">Text & Name</span>
            <span class="pipeline-node-status" id="status-node-1">Scanning...</span>
          </div>
          <div id="step-node-2" class="pipeline-step-node">
            <div class="pipeline-node-icon" id="icon-node-2">2</div>
            <span class="pipeline-node-title">Spatio-Temporal</span>
            <span class="pipeline-node-status" id="status-node-2">Pending</span>
          </div>
          <div id="step-node-3" class="pipeline-step-node">
            <div class="pipeline-node-icon" id="icon-node-3">3</div>
            <span class="pipeline-node-title">Multimodal Vision</span>
            <span class="pipeline-node-status" id="status-node-3">Pending</span>
          </div>
          <div id="step-node-4" class="pipeline-step-node">
            <div class="pipeline-node-icon" id="icon-node-4">4</div>
            <span class="pipeline-node-title">Blind Probe</span>
            <span class="pipeline-node-status" id="status-node-4">Pending</span>
          </div>
          <div id="step-node-5" class="pipeline-step-node">
            <div class="pipeline-node-icon" id="icon-node-5">5</div>
            <span class="pipeline-node-title">Evaluation</span>
            <span class="pipeline-node-status" id="status-node-5">Pending</span>
          </div>
        </div>

        <!-- Terminal Log Box -->
        <div id="pipeline-live-console" class="pipeline-console">
          <div class="pipeline-log-entry">
            <span class="log-time">[0.00s]</span>
            <span class="log-step">INIT:</span>
            <span>Initializing 5-Stage Matching Engine for item ${lostItemId}...</span>
          </div>
        </div>

        <!-- Candidate Results (Revealed upon step completion) -->
        <div id="pipeline-candidates-area" class="hidden"></div>
      </div>
    `);

    const consoleElem = document.getElementById('pipeline-live-console');
    const addLog = (step, msg, highlight = false, success = false) => {
      if (!consoleElem) return;
      const time = ((Date.now() - startTime) / 1000).toFixed(2);
      const entry = document.createElement('div');
      entry.className = 'pipeline-log-entry';
      entry.innerHTML = `
        <span class="log-time">[${time}s]</span>
        <span class="log-step">${step}:</span>
        <span class="${success ? 'log-success' : (highlight ? 'log-highlight' : '')}">${msg}</span>
      `;
      consoleElem.appendChild(entry);
      consoleElem.scrollTop = consoleElem.scrollHeight;
    };

    const startTime = Date.now();

    try {
      // 1. Fetch backend pipeline computation
      const res = await API.evaluateMatches(lostItemId, this.adminPin);
      const candidates = res.candidates || [];

      // Animate Step 1: Text & Name
      await new Promise(r => setTimeout(r, 600));
      addLog('STAGE 1', 'Executing lexical tokenization, Jaccard overlap, and brand term alignment...', true);
      await new Promise(r => setTimeout(r, 500));
      document.getElementById('icon-node-1').innerHTML = '✓';
      document.getElementById('step-node-1').className = 'pipeline-step-node complete';
      document.getElementById('status-node-1').textContent = 'Shortlisted';
      document.getElementById('pipeline-progress').style.width = '25%';

      // Animate Step 2: Spatio-Temporal
      document.getElementById('step-node-2').className = 'pipeline-step-node active';
      document.getElementById('status-node-2').textContent = 'Filtering...';
      addLog('STAGE 2', 'Applying Haversine Great-Circle formula (1-5km radius) & time-decay curve...', true);
      await new Promise(r => setTimeout(r, 700));
      if (candidates.length > 0) {
        addLog('STAGE 2', `Top candidate within ${candidates[0].distance_km} km with ${candidates[0].time_delta_hours}h temporal delta.`, false, true);
      }
      document.getElementById('icon-node-2').innerHTML = '✓';
      document.getElementById('step-node-2').className = 'pipeline-step-node complete';
      document.getElementById('status-node-2').textContent = 'Within Radius';
      document.getElementById('pipeline-progress').style.width = '50%';

      // Animate Step 3: Multimodal Vision
      document.getElementById('step-node-3').className = 'pipeline-step-node active';
      document.getElementById('status-node-3').textContent = 'Analyzing...';
      addLog('STAGE 3', 'Multimodal Vision: Cross-referencing color palettes, silhouette contours, and casing traits...', true);
      await new Promise(r => setTimeout(r, 700));
      document.getElementById('icon-node-3').innerHTML = '✓';
      document.getElementById('step-node-3').className = 'pipeline-step-node complete';
      document.getElementById('status-node-3').textContent = 'Ranked';
      document.getElementById('pipeline-progress').style.width = '75%';

      // Animate Step 4: Autonomous Blind Probe
      document.getElementById('step-node-4').className = 'pipeline-step-node active';
      document.getElementById('status-node-4').textContent = 'Probe Ready';
      addLog('STAGE 4', 'Autonomous Blind Verification Agent: Neutral challenge ready without confidential flaw leakage.', false, true);
      await new Promise(r => setTimeout(r, 600));
      document.getElementById('icon-node-4').innerHTML = '✓';
      document.getElementById('step-node-4').className = 'pipeline-step-node complete';
      document.getElementById('status-node-4').textContent = 'Anti-Fraud Ready';
      document.getElementById('pipeline-progress').style.width = '100%';

      // Animate Step 5: Final Evaluation Display
      document.getElementById('step-node-5').className = 'pipeline-step-node complete';
      document.getElementById('icon-node-5').innerHTML = '✓';
      document.getElementById('status-node-5').textContent = 'Complete';
      addLog('STAGE 5', `Composite Confidence Scores generated across ${candidates.length} candidates. Ranking displayed.`, false, true);

      // Render candidates
      const candArea = document.getElementById('pipeline-candidates-area');
      candArea.classList.remove('hidden');

      if (!candidates.length) {
        candArea.innerHTML = '<p class="text-muted" style="text-align:center; padding:1.5rem;">No matching items found within spatial-temporal constraints.</p>';
        return;
      }

      candArea.innerHTML = candidates.map(c => {
        const found = c.found_item;
        const compPct = Math.round(c.composite_score * 100);
        const textPct = Math.round(c.text_score * 100);
        const spPct = Math.round(c.spatio_temporal_score * 100);
        const visPct = Math.round(c.visual_score * 100);

        return `
          <div class="match-inspector-card">
            <div class="match-inspector-header">
              <div>
                <span class="match-rank-badge">Rank #${c.rank} Candidate</span>
                <h3 style="margin-top:0.3rem; font-size:1.15rem;">${this.escapeHtml(found.object_name)}</h3>
                <span class="field-hint">Found ID: ${c.found_item_id} • Found Location: ${this.escapeHtml(found.found_location)}</span>
              </div>
              <div class="confidence-meter">
                <span>${compPct}%</span>
                <span style="font-size:0.75rem; font-weight:500; color:var(--text-muted);">Confidence</span>
              </div>
            </div>

            <!-- Stage-by-Stage Breakdown Meters -->
            <div class="stage-breakdown-grid">
              <div class="stage-box">
                <span class="stage-box-label">Stage 1: Text & Name</span>
                <span class="stage-box-val">${textPct}%</span>
                <span class="stage-box-sub">${c.text_breakdown ? this.escapeHtml(c.text_breakdown.shared_terms.join(', ')) || 'Tokens aligned' : ''}</span>
              </div>
              <div class="stage-box">
                <span class="stage-box-label">Stage 2: Geo & Decay</span>
                <span class="stage-box-val">${spPct}%</span>
                <span class="stage-box-sub">${c.distance_km} km away • ${c.time_delta_hours}h gap</span>
              </div>
              <div class="stage-box">
                <span class="stage-box-label">Stage 3: Vision</span>
                <span class="stage-box-val">${visPct}%</span>
                <span class="stage-box-sub">Color & Silhouette matched</span>
              </div>
              <div class="stage-box">
                <span class="stage-box-label">Stage 4: Blind Probe</span>
                <span class="stage-box-val" style="color:${c.verification_status === 'VERIFIED_CONFIRMED' ? '#059669' : '#d97706'};">${c.verification_status}</span>
                <span class="stage-box-sub">Anti-Fraud Proof Check</span>
              </div>
            </div>

            <!-- Side-by-Side Photo Comparison -->
            <div class="side-by-side-photos">
              <div class="photo-compare-column">
                <label>Found Item Primary Photo</label>
                <img src="${found.primary_photo}" alt="Found Item" />
              </div>
              <div class="photo-compare-column">
                <label>Finder & Escrow Beneficiary</label>
                <div style="font-size:0.85rem; line-height:1.5;">
                  <strong>Finder:</strong> ${this.escapeHtml(found.finder_name)} (${found.finder_phone})<br/>
                  <strong>Payout UPI ID:</strong> <code>${this.escapeHtml(found.finder_upi_id)}</code><br/>
                  <strong>Custody Mode:</strong> ${found.submission_type}<br/>
                  <strong>Handover Pref:</strong> ${this.escapeHtml(found.pickup_availability)}
                </div>
              </div>
            </div>

            <!-- Admin Actions -->
            <div class="admin-action-row">
              <button class="btn btn-outline btn-sm" onclick="app.dispatchBlindProbe('${lostItemId}', '${c.found_item_id}')">
                🛡️ Dispatch Blind Verification Probe
              </button>
              <button class="btn btn-primary btn-sm" onclick="app.generateHandoverPasscode('${c.evaluation_id}')">
                🔑 Approve Match & Generate 6-Digit Passcode
              </button>
              <button class="btn btn-success btn-sm" onclick="app.adminApproveMatch('${c.evaluation_id}', 'APPROVED', true)">
                ✓ Direct Approve & Release Escrow
              </button>
              <button class="btn btn-outline btn-sm" onclick="app.adminApproveMatch('${c.evaluation_id}', 'REJECTED', false)">
                ✕ Reject Match
              </button>
            </div>
          </div>
        `;
      }).join('');

      this.refreshAdminData();
    } catch (err) {
      this.showToast(err.message || 'Error executing matching pipeline', 'error');
    }
  },

  async dispatchBlindProbe(lostItemId, foundItemId) {
    try {
      const res = await API.createProbe(lostItemId, foundItemId, 0, this.adminPin);
      this.showToast('Blind probe dispatched neutrally to finder', 'success');
      alert(`Autonomous Blind Verification Probe Dispatched!\n\n• Neutral Prompt Sent to Finder: "${res.probe.neutral_prompt}"\n• Target Zone: "${res.probe.target_area}"\n\nAnti-Fraud Guarantee: The confidential flaw (hairline crack) was completely omitted from the finder's instructions.`);
      this.runMatchEngine(lostItemId);
    } catch (err) {
      this.showToast(err.message || 'Failed to dispatch probe', 'error');
    }
  },

  async generateHandoverPasscode(evalId) {
    try {
      const res = await API.generatePasscode(evalId, this.adminPin);
      this.latestPasscode = res.passcode;

      this.openModal('Dynamic 6-Digit Handover Passcode Issued', `
        <div style="text-align:center; padding:1.5rem;">
          <span class="badge badge-verified">Handover Authorization Active</span>
          <h2 style="margin:0.75rem 0 0.5rem 0; font-size:1.3rem;">Physical Handover Passcode</h2>
          <p class="field-hint">Provide this 6-digit numeric token to the claimant for identity verification at the custody desk.</p>
          
          <div style="font-size:3rem; font-weight:800; letter-spacing:0.35em; font-family:ui-monospace, monospace; color:#18181b; background:#f8fafc; border:2px dashed #cbd5e1; border-radius:var(--radius-md); padding:1rem; margin:1.5rem auto; max-width:360px;">
            ${res.passcode}
          </div>

          <div style="font-size:0.9rem; text-align:left; background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-light); line-height:1.5;">
            <div><strong>Claimant:</strong> ${this.escapeHtml(res.owner_name)} (${res.owner_phone})</div>
            <div><strong>Item:</strong> ${this.escapeHtml(res.product_name)}</div>
            <div><strong>Expires In:</strong> 48 hours (${new Date(res.expires_at).toLocaleString()})</div>
          </div>

          <div style="margin-top:1.5rem; display:flex; gap:0.6rem; justify-content:center;">
            <button class="btn btn-primary" onclick="app.goToHandoverTerminal('${res.passcode}')">
              Open Desk Handover Terminal ➔
            </button>
          </div>
        </div>
      `);

      this.refreshAdminData();
    } catch (err) {
      this.showToast(err.message || 'Failed to generate passcode', 'error');
    }
  },

  goToHandoverTerminal(passcode) {
    this.closeModal();
    this.showSection('admin');
    this.switchAdminTab('handover');
    const input = document.getElementById('handover-passcode-input');
    if (input) input.value = passcode;
  },

  fillLatestPasscode() {
    if (this.latestPasscode) {
      document.getElementById('handover-passcode-input').value = this.latestPasscode;
      this.showToast(`Auto-filled passcode: ${this.latestPasscode}`, 'success');
    } else {
      this.showToast('No recent passcode generated yet. Generating for DEMO match...', 'info');
      // Auto-fetch if in demo mode
      API.getMatchResults('DEMO-LOST-MACBOOK', this.adminPin).then(cands => {
        if (cands.length > 0) {
          this.generateHandoverPasscode(cands[0].evaluation_id);
        }
      });
    }
  },

  async handleHandoverVerify(e) {
    e.preventDefault();
    const passcode = document.getElementById('handover-passcode-input').value.trim();
    const deskId = document.getElementById('handover-desk-select').value;
    const officer = document.getElementById('handover-officer-name').value.trim();

    if (!passcode || passcode.length !== 6) {
      this.showToast('Please enter a valid 6-digit passcode', 'error');
      return;
    }

    const btn = document.getElementById('btn-verify-handover');
    btn.disabled = true;
    btn.textContent = 'Verifying Passcode & Disbursing Escrow...';

    try {
      const res = await API.verifyHandoverPasscode(passcode, deskId, officer, this.adminPin);
      this.showToast('Handover verified! Records RESOLVED.', 'success');

      const resultBox = document.getElementById('handover-result-box');
      resultBox.classList.remove('hidden');
      resultBox.innerHTML = `
        <div class="handover-receipt-box">
          <div class="handover-receipt-header">
            <div>
              <span class="badge badge-verified">✓ Physical Handover Verified</span>
              <h3 style="margin-top:0.3rem;">Official Handover Certificate</h3>
            </div>
            <span class="passcode-pill">${res.lost_item_id}</span>
          </div>

          <div class="handover-details-grid">
            <div><strong>Recovered Item:</strong> ${this.escapeHtml(res.item_name)}</div>
            <div><strong>Claimant:</strong> ${this.escapeHtml(res.claimant_name)} (${res.claimant_phone})</div>
            <div><strong>Govt ID Check:</strong> Verified (Last 4: ${res.govt_id_last4})</div>
            <div><strong>Duty Officer:</strong> ${this.escapeHtml(res.officer_on_duty)}</div>
            <div><strong>Station / Desk:</strong> ${this.escapeHtml(res.desk_id)}</div>
            <div><strong>Time of Handover:</strong> ${new Date(res.resolved_at).toLocaleString()}</div>
          </div>

          ${res.escrow_released ? `
            <div style="background:#dcfce7; border:1px solid #86efac; border-radius:var(--radius-sm); padding:1rem; margin-top:1rem; text-align:center;">
              <strong style="color:#166534; font-size:1.05rem;">💰 Escrow Reward Disbursed Successfully!</strong>
              <div style="font-size:0.9rem; color:#15803d; margin-top:0.3rem;">
                Amount: <strong>₹${res.disbursed_amount}</strong> credited via UPI to <code>${this.escapeHtml(res.recipient_upi)}</code>
              </div>
            </div>
          ` : ''}

          <div style="margin-top:1rem; text-align:center;">
            <button class="btn btn-outline btn-sm" onclick="window.print()">🖨️ Print Handover Receipt</button>
          </div>
        </div>
      `;

      this.refreshAdminData();
    } catch (err) {
      this.showToast(err.message || 'Passcode verification failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '✓ Verify Passcode & Complete Handover';
    }
  },

  async adminApproveMatch(evalId, decision, releaseEscrow) {
    const confirmMsg = decision === 'APPROVED' 
      ? `Permanently authorize match and ${releaseEscrow ? 'disburse Escrow Reward via UPI' : 'proceed to handover'}?`
      : 'Reject this candidate match?';

    if (!confirm(confirmMsg)) return;

    try {
      await API.approveMatch(evalId, decision, releaseEscrow, 'Approved by Authorized Desk Officer', this.adminPin);
      this.showToast(`Match successfully ${decision.toLowerCase()}!`, 'success');
      this.closeModal();
      this.refreshAdminData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // --------------------------------------------------------------------------
  // Modals & Utilities
  // --------------------------------------------------------------------------
  openModal(title, bodyHtml) {
    const modal = document.getElementById('app-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    modal.classList.remove('hidden');
  },

  closeModal(e) {
    if (e && e.target && e.target.id !== 'app-modal' && !e.target.classList.contains('modal-close-btn')) return;
    const modal = document.getElementById('app-modal');
    if (modal) modal.classList.add('hidden');
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
