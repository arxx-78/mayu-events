// ========== Admin Authentication (Strict) ==========
const Auth = {
  isLoggedIn() {
    const token = localStorage.getItem('eventpro_token');
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.clearSession();
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Expiry check
      if (payload.exp * 1000 < Date.now()) {
        this.clearSession();
        return false;
      }

      // User data check
      const user = localStorage.getItem('eventpro_user');
      if (!user) {
        this.clearSession();
        return false;
      }

      return true;
    } catch {
      this.clearSession();
      return false;
    }
  },

  getToken() { return localStorage.getItem('eventpro_token'); },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('eventpro_user') || 'null');
    } catch { return null; }
  },

  save(token, user) {
    localStorage.setItem('eventpro_token', token);
    localStorage.setItem('eventpro_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('eventpro_token');
    localStorage.removeItem('eventpro_user');
  },

  logout() {
    this.clearSession();
    // Replace history to prevent back button access
    window.location.replace('login.html');
  },

  requireLogin() {
    if (!this.isLoggedIn()) {
      this.clearSession();
      window.location.replace('login.html');
      return false;
    }
    return true;
  }
};
