// backend/routes/mpesa.js
const express = require('express');
const router = express.Router();
const MpesaService = require('../mpesa/mpesaService');

const mpesaService = new MpesaService();

// Initiate STK Push
router.post('/initiate-payment', async (req, res) => {
  try {
    const { phone, amount, tenantId } = req.body;

    // Validate input
    if (!phone || !amount || !tenantId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format phone number (ensure it starts with 254)
    const formattedPhone = phone.startsWith('254') ? phone : `254${phone.slice(1)}`;

    const result = await mpesaService.initiateSTKPush(
      formattedPhone,
      amount,
      `RENT_${tenantId}`
    );

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: result
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate payment' 
    });
  }
});

// M-Pesa Callback URL
router.post('/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    
    const result = await mpesaService.handleCallback(callbackData);

    if (result.success) {
      // Send real-time update to tenant app
      // You can use WebSockets or push notifications here
      
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Success'
      });
    } else {
      res.status(200).json({
        ResultCode: 1,
        ResultDesc: result.error
      });
    }
  } catch (error) {
    console.error('Callback handling error:', error);
    res.status(200).json({
      ResultCode: 1,
      ResultDesc: 'Failed to process callback'
    });
  }
});

// Check Payment Status
router.get('/payment-status/:checkoutRequestID', async (req, res) => {
  try {
    const { checkoutRequestID } = req.params;
    
    // Implement payment status check logic
    const status = await checkPaymentStatus(checkoutRequestID);
    
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

module.exports = router;