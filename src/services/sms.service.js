const axios = require('axios');

class SMSService {
  constructor() {
    this.apiKey = process.env.TEXTBEE_API_KEY;
    this.deviceId = process.env.TEXTBEE_DEVICE_ID;
    this.apiUrl = process.env.TEXTBEE_API_URL;
  }

  /**
   * Send SMS via TextBee
   */
  async sendSMS(phoneNumber, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/gateway/devices/${this.deviceId}/sendSMS`,
        {
          recipients: Array.isArray(phoneNumber) ? phoneNumber : [phoneNumber],
          message: message
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('SMS sent successfully:', {
        to: phoneNumber,
        messageId: response.data?.id
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('SMS send error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(phoneNumbers, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/gateway/devices/${this.deviceId}/sendSMS`,
        {
          recipients: phoneNumbers,
          message: message
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Bulk SMS error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Format phone number
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      return '+91' + cleaned;
    }
    
    if (!cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
  }
}

module.exports = new SMSService();
