const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const token = "epuhpWilcSuL2RjkVLLmxC:APA91bErgnzZx8esng95a2NXZPQA8btNTCSKYnXPn_VR9Kgru4bxJAF_U2s26TlhQJGzrhdjvPpeMQjRcA7z9mrA07Jd3TC15o8EE8G05PBU9HkDOxg4wkw";

admin.messaging().send({
  token,
  notification: {
    title: "Test Notification",
    body: "If you see this, push works!"
  }
}).then(response => {
  console.log("Notification sent successfully:", response);
}).catch(error => {
  console.error("Error sending notification:", error);
});
