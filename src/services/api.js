/**
 * API Service Layer
 * Handles all HTTP requests to backend
 * Manages authentication token and request/response interceptors
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('adminToken');
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('adminToken', token);
    } else {
      localStorage.removeItem('adminToken');
    }
  }

  /**
   * Get authentication token
   */
  getToken() {
    return this.token;
  }

  /**
   * Build request headers with auth token
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Generic fetch request handler
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: this.getHeaders(),
    };

    const headers = {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    };

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const config = { ...defaultOptions, ...options, headers };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ==================== AUTH ENDPOINTS ====================

  /**
   * Admin Login
   * POST /api/auth/login
   */
  login(email, password) {
    return this.post('/api/auth/login', { email, password });
  }

  /**
   * Logout
   */
  logout() {
    this.setToken(null);
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all users
   * GET /api/admin/users
   */
  getAllUsers() {
    return this.get('/api/admin/users');
  }

  /**
   * Get all drivers with detailed information
   * GET /api/admin/drivers
   */
  getAllDrivers() {
    return this.get('/api/admin/drivers');
  }

  /**
   * Get all vehicle categories
   * GET /api/admin/vehicle-categories
   */
  getVehicleCategories() {
    return this.get('/api/admin/vehicle-categories');
  }

  /**
   * Create a vehicle category
   * POST /api/vehicle-categories
   */
  createVehicleCategory(payload) {
    const body = payload instanceof FormData ? payload : JSON.stringify(payload);

    return this.request('/api/vehicle-categories', {
      method: 'POST',
      body,
    });
  }

  /**
   * Create a notification for mobile/web users
   * POST /api/admin/notifications
   */
  async createNotification(payload) {
    const endpointCandidates = [
      import.meta.env.VITE_NOTIFICATION_CREATE_ENDPOINT,
      '/api/admin/notifications',
      '/api/notifications',
    ].filter(Boolean);

    let lastError = null;

    for (const endpoint of endpointCandidates) {
      try {
        return await this.post(endpoint, payload);
      } catch (error) {
        lastError = error;

        const message = String(error?.message || '');
        const looksLikeMissingRoute = message.includes('404') || message.toLowerCase().includes('route not found');

        if (!looksLikeMissingRoute || endpoint === endpointCandidates[endpointCandidates.length - 1]) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Unable to create notification.');
  }

  /**
   * Emit a ride-cancellation notification.
   * Uses a role-specific endpoint when configured, then falls back to the general notification endpoint.
   */
  async notifyRideCancellation({ requestedBy, tripId, reason = '', trip = null, actor = 'admin' }) {
    const isDriverCancellation = requestedBy === 'driver';
    const title = isDriverCancellation ? `Driver cancelled ${tripId}` : `Customer cancelled ${tripId}`;
    const message = isDriverCancellation
      ? `The driver cancelled trip ${tripId}${reason ? `: ${reason}` : ''}.`
      : `The customer cancelled trip ${tripId}${reason ? `: ${reason}` : ''}.`;

    const payload = {
      recipientRole: isDriverCancellation ? 'customer' : 'driver',
      recipientUserId: !isDriverCancellation ? trip?.driverId || null : null,
      title,
      message,
      type: 'trip_alert',
      isRead: false,
      tripId,
      requestedBy,
      reason,
      actor,
    };

    const endpointCandidates = [
      isDriverCancellation
        ? import.meta.env.VITE_DRIVER_RIDE_CANCELLATION_NOTIFICATION_ENDPOINT
        : import.meta.env.VITE_CUSTOMER_RIDE_CANCELLATION_NOTIFICATION_ENDPOINT,
      isDriverCancellation
        ? '/api/admin/notifications/driver-cancelled'
        : '/api/admin/notifications/customer-cancelled',
      isDriverCancellation
        ? '/api/notifications/driver-cancelled'
        : '/api/notifications/customer-cancelled',
    ].filter(Boolean);

    for (const endpoint of endpointCandidates) {
      try {
        return await this.request(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (error) {
        const messageText = String(error?.message || '');
        const looksLikeMissingRoute = messageText.includes('404') || messageText.toLowerCase().includes('route not found');

        if (!looksLikeMissingRoute || endpoint === endpointCandidates[endpointCandidates.length - 1]) {
          break;
        }
      }
    }

    return this.createNotification(payload);
  }

  /**
   * Get all notifications
   * GET /api/admin/notifications
   */
  getAllNotifications() {
    return this.get('/api/admin/notifications');
  }

  /**
   * Get all support requests
   * GET /api/support/
   */
  getAllSupportRequests() {
    return this.get('/api/support/');
  }

  /**
   * Get a single support request by ID
   * GET /api/support/:id
   */
  getSupportRequestById(id) {
    return this.get(`/api/support/${id}`);
  }

  /**
   * Mark a support request as read
   * PATCH /api/support/:id/read
   */
  markSupportRequestAsRead(id) {
    return this.request(`/api/support/${id}/read`, {
      method: 'PATCH',
    });
  }

  /**
   * Get driver chat history for admin
   * GET /api/admin/chat/driver/:driverUserId/messages
   */
  getDriverChatMessages(driverUserId) {
    return this.get(`/api/admin/chat/driver/${driverUserId}/messages`);
  }

  /**
   * Send a driver chat message from admin
   * POST /api/admin/chat/driver/:driverUserId/messages
   */
  sendDriverChatMessage(driverUserId, text) {
    return this.post(`/api/admin/chat/driver/${driverUserId}/messages`, { text });
  }

  /**
   * Get all bookings
   * GET /api/admin/bookings
   */
  getAllBookings() {
    return this.get('/api/admin/bookings');
  }

  /**
   * Get booking details by ID
   * GET /api/admin/bookings/:id
   */
  getBookingById(id) {
    return this.get(`/api/admin/bookings/${id}`);
  }

  /**
   * Assign a driver to a booking
   * PATCH /api/bookings/:bookingId/assign-driver
   */
  assignDriverToBooking(bookingId, driverId) {
    return this.request(`/api/bookings/${bookingId}/assign-driver`, {
      method: 'PATCH',
      body: JSON.stringify({ driverId }),
    });
  }

  /**
   * Get customers (filter users by role=customer)
   * GET /api/admin/users?role=customer
   */
  async getCustomers() {
    const response = await this.getAllUsers();
    return {
      ...response,
      data: response.data.filter(user => user.role === 'customer'),
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();

export default apiService;
