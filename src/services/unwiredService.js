/**
 * GeoGuard Unwired Labs Service
 * Cell tower triangulation for feature phones
 */

const axios = require('axios');

/**
 * Resolve location from cell tower data using Unwired Labs API
 * @param {number} cid - Cell ID
 * @param {number} lac - Location Area Code
 * @param {number} mcc - Mobile Country Code (default: 404 for India)
 * @param {number} mnc - Mobile Network Code (default: 45 for Airtel India)
 * @returns {Promise<Object>} { lat, lng, accuracy }
 */
async function resolveLocation(cid, lac, mcc = 404, mnc = 40) {
  try {
    // Validate inputs
    if (!cid || !lac) {
      throw new Error('CID and LAC are required');
    }

    const apiUrl = process.env.UNWIRED_API_URL || 'https://us1.unwiredlabs.com/v2/process.php';
    const apiToken = process.env.UNWIRED_API_KEY;

    if (!apiToken) {
      throw new Error('UNWIRED_API_KEY not configured in environment variables');
    }

    // Prepare request payload
    const payload = {
      token: apiToken,
      radio: 'nr',
      mcc: parseInt(mcc),
      mnc: parseInt(mnc),
      cells: [
        {
          lac: parseInt(lac),
          cid: parseInt(cid),
        },
      ],
      address: 0, // Don't need reverse geocoding
    };

    console.log(`[Unwired Labs] Resolving location for CID: ${cid}, LAC: ${lac}, MCC: ${mcc}, MNC: ${mnc}`);

    // Make API request
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Check response status
    if (response.data.status !== 'ok') {
      throw new Error(`Unwired Labs API error: ${response.data.message || 'Unknown error'}`);
    }

    const { lat, lon, accuracy } = response.data;

    if (!lat || !lon) {
      throw new Error('Invalid response from Unwired Labs API - missing coordinates');
    }

    console.log(`[Unwired Labs] Location resolved: Lat ${lat}, Lng ${lon}, Accuracy ${accuracy}m`);

    return {
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      accuracy: accuracy ? parseFloat(accuracy) : null,
    };
  } catch (error) {
    console.error('[Unwired Labs] Error resolving location:', error.message);

    // Provide more context for common errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        throw new Error('Unwired Labs API authentication failed - check your API key');
      } else if (status === 429) {
        throw new Error('Unwired Labs API rate limit exceeded');
      } else if (status === 400) {
        throw new Error(`Invalid cell tower data: ${data.message || 'Bad request'}`);
      }
    }

    throw error;
  }
}

/**
 * Parse cell tower data from SMS message
 * Expected format: "ATT CID:4521 LAC:120" or "CID:4521 LAC:120"
 * @param {string} message - SMS message content
 * @returns {Object} { cid, lac } or null if parsing fails
 */
function parseCellDataFromSMS(message) {
  try {
    // Regex to extract CID and LAC
    const cidMatch = message.match(/CID[:\s]+(\d+)/i);
    const lacMatch = message.match(/LAC[:\s]+(\d+)/i);

    if (!cidMatch || !lacMatch) {
      return null;
    }

    return {
      cid: parseInt(cidMatch[1]),
      lac: parseInt(lacMatch[1]),
    };
  } catch (error) {
    console.error('[Unwired Labs] Error parsing SMS:', error.message);
    return null;
  }
}

module.exports = {
  resolveLocation,
  parseCellDataFromSMS,
};
