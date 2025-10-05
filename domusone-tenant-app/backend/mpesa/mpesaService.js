// backend/mpesa/mpesaService.js (Node.js/Express)
const axios = require('axios');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackURL = process.env.MPESA_CALLBACK_URL;
  }

  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async initiateSTKPush(phone, amount, accountReference) {
    try {
      const accessToken = await this.getAccessToken();
      
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);
      
      const password = Buffer.from(
        `${this.businessShortCode}${this.passkey}${timestamp}`
      ).toString('base64');

      const requestData = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: this.businessShortCode,
        PhoneNumber: phone,
        CallBackURL: this.callbackURL,
        AccountReference: accountReference,
        TransactionDesc: 'Rent Payment',
      };

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error initiating STK push:', error);
      throw error;
    }
  }

  async handleCallback(callbackData) {
    try {
      const resultCode = callbackData.Body.stkCallback.ResultCode;
      const resultDesc = callbackData.Body.stkCallback.ResultDesc;
      const checkoutRequestID = callbackData.Body.stkCallback.CheckoutRequestID;

      if (resultCode === 0) {
        // Payment successful
        const metadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
        
        const paymentData = {
          amount: metadata.find(item => item.Name === 'Amount').Value,
          mpesaReceiptNumber: metadata.find(item => item.Name === 'MpesaReceiptNumber').Value,
          phoneNumber: metadata.find(item => item.Name === 'PhoneNumber').Value,
          transactionDate: metadata.find(item => item.Name === 'TransactionDate').Value,
        };

        // Save to database
        await this.saveSuccessfulPayment(paymentData, checkoutRequestID);
        
        return { success: true, data: paymentData };
      } else {
        // Payment failed
        await this.saveFailedPayment(checkoutRequestID, resultDesc);
        return { success: false, error: resultDesc };
      }
    } catch (error) {
      console.error('Error handling callback:', error);
      throw error;
    }
  }

  async saveSuccessfulPayment(paymentData, checkoutRequestID) {
    // Save to your database
    // Update tenant payment record
    // Send confirmation notification
  }

  async saveFailedPayment(checkoutRequestID, errorDescription) {
    // Log failed payment attempt
    // Notify tenant about failed payment
  }
}

module.exports = MpesaService;