// server.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post('/send-notification', async (req, res) => {
  try {
    const message = {
      to: req.body.to,
      notification: req.body.notification,
      data: req.body.data
    };
    
    const response = await admin.messaging().send(message);
    res.json({ success: true, message_id: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
