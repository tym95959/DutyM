if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(registration => {
        console.log('Service Worker registered:', registration);
    }).catch(err => console.log('SW registration failed:', err));
}
