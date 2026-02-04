importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
  projectId: "leelidc-1f753",
  messagingSenderId: "43622932335",
  appId: "1:43622932335:web:a7529bce1f19714687129a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message', payload);
  const { title, body } = payload.notification;
  self.registration.showNotification(title, { body });
});
