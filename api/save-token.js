// api/save-token.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const { token, userId } = req.body;
      
      // In a real app, save to database
      // For demo, we'll just return success
      console.log('Token received:', token?.substring(0, 20) + '...');
      
      return res.status(200).json({
        success: true,
        message: 'Token saved (simulated)'
      });
      
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Token API is running',
      endpoints: ['POST /api/save-token', 'POST /api/send-notification']
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
