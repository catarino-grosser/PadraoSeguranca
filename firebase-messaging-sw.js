// Precisa ficar na RAIZ do site (mesma pasta do index.html), com esse nome
// exato — é o padrão que o Firebase Cloud Messaging espera.

importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAIiqAfdfqEYU2nHR7BnQKddGm8Yz2F1ZM",
  authDomain: "padrao-seguranca.firebaseapp.com",
  projectId: "padrao-seguranca",
  storageBucket: "padrao-seguranca.firebasestorage.app",
  messagingSenderId: "255787773246",
  appId: "1:255787773246:web:3c7d59fd708ce39db2106f"
});

const messaging = firebase.messaging();

// Chamado quando chega notificação com o app em segundo plano / fechado.
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Central de Segurança", {
    body: body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico"
  });
});
