export default function handler(req, res) {
  if (req.method === 'POST') {
    // In production, save token to a database
    console.log('Token received:', req.body.token);
    res.status(200).json({ message: 'Token saved' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
