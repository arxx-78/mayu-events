const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? (window.location.port === '5000' ? '/api' : 'http://localhost:5000/api')
  : '/api';

const API = {
  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const token = localStorage.getItem('eventpro_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && window.location.pathname.includes('admin')) {
          localStorage.removeItem('eventpro_token');
          window.location.href = 'login.html';
        }
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  health: () => API.request('/health'),
  createBooking: (data) => API.request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return API.request(`/bookings?${query}`);
  },
  getStats: () => API.request('/bookings/stats'),
  updateBooking: (id, data) => API.request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBooking: (id) => API.request(`/bookings/${id}`, { method: 'DELETE' }),
  sendContact: (data) => API.request('/contact', { method: 'POST', body: JSON.stringify(data) }),
  login: (email, password) => API.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => API.request('/auth/me'),
  createOrder: (amount, bookingId) => API.request('/payment/create-order', { method: 'POST', body: JSON.stringify({ amount, bookingId }) }),
  verifyPayment: (data) => API.request('/payment/verify', { method: 'POST', body: JSON.stringify(data) }),
  getPaymentConfig: () => API.request('/payment/config')
};
