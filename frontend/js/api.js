/**
 * Smart Lost & Found Platform - Frontend API Client
 * AegisRecover - Double-Blind AI Verification & Escrow Architecture
 */

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // --------------------------------------------------------------------------
  // User Authentication
  // --------------------------------------------------------------------------
  async register(payload) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async login(payload) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getMe(token) {
    return this.request('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // --------------------------------------------------------------------------
  // Verified Custody Desks
  // --------------------------------------------------------------------------
  async getDesks() {
    return this.request('/api/desks');
  },

  async getDesk(id) {
    return this.request(`/api/desks/${id}`);
  },

  // --------------------------------------------------------------------------
  // Lost Items Ingestion
  // --------------------------------------------------------------------------
  async createLostItem(payload) {
    return this.request('/api/lost-items', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getLostItem(id, token = '') {
    return this.request(`/api/lost-items/${id}${token ? `?token=${encodeURIComponent(token)}` : ''}`);
  },

  // --------------------------------------------------------------------------
  // Found Items Ingestion (Dual Mode)
  // --------------------------------------------------------------------------
  async createDeskFoundItem(payload) {
    return this.request('/api/found-items/desk', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async createDirectFoundItem(payload) {
    return this.request('/api/found-items/direct', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // --------------------------------------------------------------------------
  // User Status & Tracking
  // --------------------------------------------------------------------------
  async lookupStatus(phoneOrToken) {
    return this.request('/api/user-status/lookup', {
      method: 'POST',
      body: JSON.stringify({ phone_or_token: phoneOrToken })
    });
  },

  // --------------------------------------------------------------------------
  // Verification & Phone OTP
  // --------------------------------------------------------------------------
  async sendOTP(phone) {
    return this.request('/api/verification/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  },

  async verifyOTP(phone, code) {
    return this.request('/api/verification/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code })
    });
  },

  // --------------------------------------------------------------------------
  // 1-Click Demo Dataset Seeder
  // --------------------------------------------------------------------------
  async seedDemo(pin = 'admin123') {
    return this.request('/api/admin/seed-demo', {
      method: 'POST',
      headers: { 'x-admin-pin': pin }
    });
  },

  // --------------------------------------------------------------------------
  // Admin Portal & Desks
  // --------------------------------------------------------------------------
  async adminLogin(pin) {
    return this.request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
  },

  async getAdminLostItems(pin) {
    return this.request('/api/admin/lost-items', {
      headers: { 'x-admin-pin': pin }
    });
  },

  async getAdminFoundItems(pin) {
    return this.request('/api/admin/found-items', {
      headers: { 'x-admin-pin': pin }
    });
  },

  async getAdminEscrowRecords(pin) {
    return this.request('/api/admin/escrow-records', {
      headers: { 'x-admin-pin': pin }
    });
  },

  async updateItemStatus(itemId, status, pin) {
    return this.request(`/api/admin/items/${itemId}/status`, {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
      body: JSON.stringify({ status })
    });
  },

  async releaseEscrow(escrowId, recipientUpi, pin) {
    return this.request(`/api/admin/escrow/${escrowId}/release`, {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
      body: JSON.stringify({ recipient_upi: recipientUpi })
    });
  },

  // --------------------------------------------------------------------------
  // 5-Stage Matching Engine & Autonomous Verification Probes
  // --------------------------------------------------------------------------
  async evaluateMatches(lostItemId, pin) {
    return this.request(`/api/matching/evaluate/${lostItemId}`, {
      method: 'POST',
      headers: { 'x-admin-pin': pin }
    });
  },

  async getMatchResults(lostItemId, pin) {
    return this.request(`/api/matching/results/${lostItemId}`, {
      headers: { 'x-admin-pin': pin }
    });
  },

  async createProbe(lostItemId, foundItemId, secretIndex = 0, pin) {
    return this.request('/api/matching/create-probe', {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
      body: JSON.stringify({
        lost_item_id: lostItemId,
        found_item_id: foundItemId,
        secret_point_index: secretIndex
      })
    });
  },

  async getFinderProbes(foundItemId) {
    return this.request(`/api/matching/probes/found/${foundItemId}`);
  },

  async submitProbeResponse(probeId, photoData, notes = '') {
    return this.request(`/api/matching/probes/${probeId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        photo_data: photoData,
        finder_notes: notes
      })
    });
  },

  async approveMatch(evalId, decision, releaseEscrow, notes, pin) {
    return this.request(`/api/matching/matches/${evalId}/approve`, {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
      body: JSON.stringify({
        decision: decision,
        release_escrow: releaseEscrow,
        notes: notes
      })
    });
  },

  async generatePasscode(evalId, pin) {
    return this.request(`/api/matching/matches/${evalId}/generate-passcode`, {
      method: 'POST',
      headers: { 'x-admin-pin': pin }
    });
  },

  async verifyHandoverPasscode(passcode, deskId = 'DESK-MAIN-01', officerName = 'Duty Officer', pin = 'admin123') {
    return this.request('/api/matching/handover/verify-passcode', {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
      body: JSON.stringify({
        passcode: passcode,
        desk_id: deskId,
        officer_name: officerName
      })
    });
  }
};
