import { db, messaging, FieldValue, jsonResponse } from "./_shared/firebaseAdmin.js";

// Minutos que um alerta pode ficar "Aberto" antes de ser escalado.
// Configurável via variável de ambiente SLA_MINUTOS no Netlify (opcional).
const SLA_MINUTOS = Number(process.env.SLA_MINUTOS || 10);

export default async () => {
  try {
    const limite = new Date(Date.now() - SLA_MINUTOS * 60 * 1000);

    const abertosSnap = await db.collection("alertas").where("status", "==", "Aberto").get();

    const atrasados = abertosSnap.docs.filter((doc) => {
      const alerta = doc.data();
      if (alerta.escalado) return false; // já escalado antes, não repete
      const criadoEm = alerta.criadoEm?.toDate?.();
      return criadoEm && criadoEm < limite;
    });

    if (atrasados.length === 0) {
      return jsonResponse({ escalados: 0 });
    }

    const vigilantesSnap = await db
      .collection("users")
      .where("role", "==", "vigilante")
      .where("ativo", "==", true)
      .get();

    const tokens = vigilantesSnap.docs.map((doc) => doc.data().fcmToken).filter(Boolean);

    for (const alertaDoc of atrasados) {
      const alerta = alertaDoc.data();

      if (tokens.length > 0) {
        await messaging.sendEachForMulticast({
          tokens,
          notification: {
            title: `⏰ Alerta parado há mais de ${SLA_MINUTOS} min`,
            body: `${alerta.condominioNome || ""} — ${alerta.portariaNome || ""}`
          },
          webpush: {
            fcmOptions: { link: "/" }
          }
        });
      }

      await alertaDoc.ref.update({
        escalado: true,
        escaladoEm: FieldValue.serverTimestamp()
      });
    }

    return jsonResponse({ escalados: atrasados.length });
  } catch (err) {
    console.error("checar-sla:", err);
    return jsonResponse({ error: err.message || "Erro ao checar SLA." }, 500);
  }
};

// Roda automaticamente a cada 5 minutos — não precisa ser chamada por ninguém.
export const config = {
  schedule: "*/5 * * * *"
};
