const Analytics = {
  track(event, data = {}) {
    const payload = {
      event,
      data,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`
    };
    console.log('📊 Event:', payload);
    const events = JSON.parse(localStorage.getItem('eventpro_analytics') || '[]');
    events.push(payload);
    if (events.length > 200) events.shift();
    localStorage.setItem('eventpro_analytics', JSON.stringify(events));
  },
  pageView() { this.track('page_view', { page: window.location.pathname }); },
  bookingStart() { this.track('booking_start'); },
  bookingSubmit(data) { this.track('booking_submit', { eventType: data.eventType }); },
  whatsappClick() { this.track('whatsapp_click'); },
  phoneClick() { this.track('phone_click'); },
  serviceView(name) { this.track('service_view', { name }); }
};

Analytics.pageView();
