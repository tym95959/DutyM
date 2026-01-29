// firebase-service.js
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./dcfire.js";

class FirebaseService {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.messaging = getMessaging(this.app);
    this.messagesCollection = collection(this.db, "messages");
  }

  // Send message
  async sendMessage(messageData) {
    try {
      const docRef = await addDoc(this.messagesCollection, {
        ...messageData,
        timestamp: serverTimestamp(),
        read: false
      });
      console.log("Message sent with ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error sending message: ", error);
      throw error;
    }
  }

  // Get FCM token for push notifications
  async getFCMToken() {
    try {
      const currentToken = await getToken(this.messaging, { 
        vapidKey: "BCMEhQHZvwuii0Pul11PRfM68N_C4iox9c6jUwWoj21lvKZ2hhAfRe-5KwG_A1xMsQ04aelb8XM7x-mXNYzak1o" // You need to generate this in Firebase Console
      });
      if (currentToken) {
        console.log("FCM Token:", currentToken);
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  // Listen for new messages
  listenForMessages(callback) {
    const messagesQuery = query(
      this.messagesCollection, 
      orderBy("timestamp", "desc")
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(messages);
    });
  }
}

export default new FirebaseService();
