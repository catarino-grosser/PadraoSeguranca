import { db, messaging, FieldValue, requireAuth, jsonResponse } from "./_shared/firebaseAdmin.js";

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    // Qualquer funcionário autenticado pode disparar (normalmente o porteiro,
    // logo após criar o alerta) — não precisa ser admin.
    await requireAuth(req);

    const { condominioNome, portariaNome, prioridade, observacao } = await req.json();

    const vigilantesSnap = await db
      .collection("users")
      .where("role", "==", "vigilante")
      .where("ativo", "==", true)
      .get();

    const tokens = vigilantesSnap.docs.map((doc) => doc.data().fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return jsonResponse({ sent: 0, message: "Nenhum vigilante com notificações ativadas ainda." });
    }

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: `🚨 Alerta ${prioridade || "Normal"} — ${condominioNome || ""}`,
        body: `${portariaNome || ""}${observacao ? " — " + observacao : ""}`
      },
      webpush: {
        fcmOptions: { link: "/" }
      }
    });

    // Limpa tokens inválidos/expirados que o Firebase apontou na resposta,
    // pra não tentar mandar pra eles de novo da próxima vez.
    const tokensInvalidos = [];
    response.responses.forEach((r, i) => {
      if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
        tokensInvalidos.push(tokens[i]);
      }
    });

    if (tokensInvalidos.length > 0) {
      const batch = db.batch();
      vigilantesSnap.docs.forEach((doc) => {
        if (tokensInvalidos.includes(doc.data().fcmToken)) {
          batch.update(doc.ref, { fcmToken: FieldValue.delete() });
        }
      });
      await batch.commit();
    }

    return jsonResponse({ sent: response.successCount, failed: response.failureCount });
  } catch (err) {
    console.error("notificar-alerta:", err);
    return jsonResponse({ error: err.message || "Erro ao notificar vigilantes." }, err.statusCode || 500);
  }
};
