import { app, db, doc, updateDoc, serverTimestamp } from "./firebase.js";
import { state } from "./state.js";
import { toast } from "./utils.js";

// Chave pública (VAPID) do projeto — pegue em:
// Firebase Console → Configurações do projeto → Cloud Messaging →
// Certificados push da Web → "Gerar par de chaves".
// Essa chave é pública, pode ficar no código do cliente sem problema.
const VAPID_KEY = "COLE_AQUI_SUA_VAPID_KEY_DO_FIREBASE";

export async function ativarNotificacoes(btn) {
  if (!state.currentUser) return;

  if (VAPID_KEY.startsWith("COLE_AQUI")) {
    toast("Configuração pendente: defina a VAPID_KEY em js/push.js.");
    return;
  }

  if (btn) btn.disabled = true;

  try {
    // Import dinâmico: só carrega o módulo de Messaging quando o botão é
    // clicado, então navegadores sem suporte não quebram o app inteiro.
    const { getMessaging, getToken, isSupported } = await import(
      "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js"
    );

    if (!(await isSupported())) {
      toast("Este navegador não suporta notificações push.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast("Permissão de notificação negada.");
      return;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (!token) {
      toast("Não foi possível gerar o token de notificação.");
      return;
    }

    await updateDoc(doc(db, "users", state.currentUser.uid), {
      fcmToken: token,
      atualizadoEm: serverTimestamp()
    });

    toast("Notificações ativadas! 🔔");
  } catch (err) {
    console.error("ativarNotificacoes:", err);
    toast("Erro ao ativar notificações.");
  } finally {
    if (btn) btn.disabled = false;
  }
}
