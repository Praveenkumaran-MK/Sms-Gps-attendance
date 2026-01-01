const axios = require('axios');

class LocationService {
  constructor() {
    this.unwiredApiKey = process.env.UNWIRED_API_KEY;
    this.unwiredApiUrl = process.env.UNWIRED_API_URL;
  }

  /**
   * Get location from WiFi networks using Unwired Labs
   */
  async getLocationFromWiFi(wifiNetworks) {
    try {
      const response = await axios.post(this.unwiredApiUrl, {
        token: this.unwiredApiKey,
        wifi: wifiNetworks
      });

      return {
        success: true,
        lat: response.data.lat,
        lng: response.data.lon,
        accuracy: response.data.accuracy
      };
    } catch (error) {
      console.error('Unwired Labs error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get location from cell tower data
   */
  async getLocationFromCellTower(cellData) {
    try {
      const response = await axios.post(this.unwiredApiUrl, {
        token: this.unwiredApiKey,
        radio: cellData.radio || 'gsm',
        mcc: cellData.mcc,
        mnc: cellData.mnc,
        cells: cellData.cells
      });

      return {
        success: true,
        lat: response.data.lat,
        lng: response.data.lon,
        accuracy: response.data.accuracy
      };
    } catch (error) {
      console.error('Cell tower location error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = new LocationService();
