// ========== API Client ==========
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? (window.location.port === '5000' ? '/api' : 'http://localhost:5000/api')
  : 'https://mayu-events-backend.onrender.com/api';

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

    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        const text = await response.text();
        if (!text) {
          throw new Error('EMPTY_RESPONSE');
        }
        
        const data = JSON.parse(text);

        if (!response.ok) {
          if (response.status === 401 && window.location.pathname.includes('admin')) {
            localStorage.removeItem('eventpro_token');
            window.location.href = 'login.html';
          }
          throw new Error(data.message || 'Request failed');
        }
        return data;
      } catch (error) {
        if ((error.message === 'EMPTY_RESPONSE' || error.message.includes('JSON') || error.message.includes('fetch')) && retries < maxRetries) {
          retries++;
          console.log(`Server waking up... Retry ${retries}/${maxRetries} in 20 seconds`);
          await new Promise(r => setTimeout(r, 20000)); 
          continue;
        }
        console.error('API Error:', error);
        throw new Error('Server is starting up. Please wait a moment and try again.');
      }
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
