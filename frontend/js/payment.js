const Payment = {
  async start(amount, bookingId, customerInfo = {}) {
    try {
      const configRes = await API.getPaymentConfig();
      const keyId = configRes.data.keyId;
      if (!keyId) {
        alert('Payment gateway not configured.');
        return false;
      }
      const orderRes = await API.createOrder(amount, bookingId);
      const order = orderRes.data;

      return new Promise((resolve) => {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'EventPro',
          description: 'Event Booking Payment',
          order_id: order.orderId,
          prefill: {
            name: customerInfo.name || '',
            email: customerInfo.email || '',
            contact: customerInfo.phone || ''
          },
          theme: { color: '#e91e63' },
          handler: async (response) => {
            try {
              await API.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId
              });
              resolve(true);
            } catch (err) {
              resolve(false);
            }
          },
          modal: { ondismiss: () => resolve(false) }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (error) {
      alert('Payment failed: ' + error.message);
      return false;
    }
  }
};
