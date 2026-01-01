const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendance.service');

/**
 * Location capture page (HTML with GPS)
 */
router.get('/location', (req, res) => {
  const { phone, type, session } = req.query;

  if (!phone || !type || !session) {
    return res.status(400).send('Missing required parameters');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Share Location - ${type}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px 30px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        }
        h2 {
          color: #333;
          margin-bottom: 10px;
          font-size: 24px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1s linear infinite;
          margin: 30px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .status {
          margin: 20px 0;
          font-size: 16px;
          color: #555;
          line-height: 1.6;
        }
        .success { color: #10b981; font-weight: 600; }
        .error { color: #ef4444; font-weight: 600; }
        .icon { font-size: 48px; margin: 20px 0; }
        .details {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          font-size: 14px;
          color: #374151;
        }
        .close-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
          display: none;
        }
        .close-btn:hover {
          background: #5568d3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Attendance ${type}</h2>
        <p class="subtitle">Capturing your location...</p>
        
        <div class="loader" id="loader"></div>
        <div class="icon" id="icon"></div>
        <div class="status" id="status">Please wait while we get your location...</div>
        <div class="details" id="details" style="display:none;"></div>
        <button class="close-btn" id="closeBtn" onclick="window.close()">Close</button>
        
        <script>
          const phone = '${phone}';
          const type = '${type}';
          const session = '${session}';
          
          function showResult(success, message, details) {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('icon').textContent = success ? '✅' : '❌';
            document.getElementById('status').innerHTML = message;
            document.getElementById('status').className = 'status ' + (success ? 'success' : 'error');
            
            if (details) {
              document.getElementById('details').innerHTML = details;
              document.getElementById('details').style.display = 'block';
            }
            
            document.getElementById('closeBtn').style.display = 'inline-block';
          }
          
          if (navigator.geolocation) {
            const options = {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            };
            
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                document.getElementById('status').textContent = 'Validating location...';
                
                try {
                  const response = await fetch('/api/mark-attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      phone: phone,
                      type: type,
                      session: session,
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                      accuracy: position.coords.accuracy,
                      method: 'GPS'
                    })
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    const details = 
                      'Distance from work: <strong>' + Math.round(data.distance) + ' meters</strong><br>' +
                      'Time: <strong>' + new Date(data.timestamp).toLocaleTimeString('en-IN') + '</strong>';
                    
                    showResult(
                      true,
                      '🎉 Attendance marked successfully!',
                      details
                    );
                  } else {
                    showResult(
                      false,
                      '❌ ' + data.message,
                      'Please ensure you are within the designated work location.'
                    );
                  }
                } catch (error) {
                  showResult(
                    false,
                    'Network error occurred',
                    error.message
                  );
                }
              },
              (error) => {
                let errorMsg = '';
                switch(error.code) {
                  case error.PERMISSION_DENIED:
                    errorMsg = 'Location access denied. Please enable location permissions in your browser settings.';
                    break;
                  case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Location information unavailable. Please check your GPS settings.';
                    break;
                  case error.TIMEOUT:
                    errorMsg = 'Location request timed out. Please try again.';
                    break;
                  default:
                    errorMsg = 'An unknown error occurred.';
                }
                showResult(false, errorMsg, null);
              },
              options
            );
          } else {
            showResult(
              false,
              'Geolocation not supported',
              'Your device does not support location services.'
            );
          }
        </script>
      </body>
    </html>
  `);
});

/**
 * Mark attendance API endpoint
 */
router.post('/mark-attendance', async (req, res) => {
  try {
    const { phone, type, lat, lng, accuracy, method } = req.body;

    if (!phone || !type || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const result = await attendanceService.markAttendance(
      phone,
      type,
      parseFloat(lat),
      parseFloat(lng),
      method || 'GPS'
    );

    res.json(result);
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get attendance records
 */
router.get('/records/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { startDate, endDate } = req.query;

    const records = await attendanceService.getAttendanceRecords(
      phone,
      startDate,
      endDate
    );

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get today's status
 */
router.get('/status/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const status = await attendanceService.getTodayStatus(phone);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
