// api/send-notification.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { payload, serverKey } = req.body;
    
    if (!payload || !serverKey) {
      return res.status(400).json({ error: 'Missing payload or serverKey' });
    }
    
    // Send to FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${serverKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const fcmResult = await fcmResponse.json();
    
    return res.status(200).json({
      success: true,
      message_id: fcmResult.message_id || fcmResult.results?.[0]?.message_id,
      fcm_response: fcmResult
    });
    
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
}
