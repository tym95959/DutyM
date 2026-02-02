
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// 🔴 Define your config here (cannot import from other files)
const firebaseConfig = {
  apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
  authDomain: "leelidc-1f753.firebaseapp.com",
  projectId: "leelidc-1f753",
  storageBucket: "leelidc-1f753.firebasestorage.app",
  messagingSenderId: "43622932335",
  appId: "1:43622932335:web:a7529bce1f19714687129a",
  measurementId: "G-3KD6ZYS599",
  databaseURL: "https://leelidc-1f753-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Optional: background notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] BG message:", payload);
  self.registration.showNotification(
    payload.notification?.title || "Notification",
    { body: payload.notification?.body || "", icon: "/icon-192.png" }
  );
});
