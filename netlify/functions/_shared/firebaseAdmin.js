import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// Evita "already initialized" quando a Lambda reaproveita o mesmo container
// entre chamadas (comportamento normal do Netlify Functions).
let app;
if (!getApps().length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      "Variável de ambiente FIREBASE_SERVICE_ACCOUNT_JSON não configurada no Netlify."
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON não é um JSON válido — confira se colou o arquivo inteiro."
    );
  }

  app = initializeApp({ credential: cert(serviceAccount) });
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export { FieldValue };

function extractToken(req) {
  const header = req.headers.get("authorization") || "";
  return header.replace("Bearer ", "").trim();
}

/**
 * Verifica o token do Firebase enviado pelo app e exige que o usuário
 * seja um ADM ativo (checa direto no Firestore, não no custom claim —
 * assim continua funcionando mesmo para o admin criado manualmente no
 * bootstrap, que ainda não tem claim nenhum).
 */
export async function requireAdmin(req) {
  const idToken = extractToken(req);
  if (!idToken) {
    const err = new Error("Token de autenticação não enviado.");
    err.statusCode = 401;
    throw err;
  }

  const decoded = await auth.verifyIdToken(idToken);
  const callerDoc = await db.collection("users").doc(decoded.uid).get();
  const perfil = callerDoc.data();

  if (!callerDoc.exists || perfil.role !== "adm" || perfil.ativo === false) {
    const err = new Error("Apenas administradores podem executar esta ação.");
    err.statusCode = 403;
    throw err;
  }

  return { uid: decoded.uid, profile: perfil };
}

/** Igual ao requireAdmin, mas aceita qualquer funcionário ativo (não só ADM). */
export async function requireAuth(req) {
  const idToken = extractToken(req);
  if (!idToken) {
    const err = new Error("Token de autenticação não enviado.");
    err.statusCode = 401;
    throw err;
  }

  const decoded = await auth.verifyIdToken(idToken);
  const callerDoc = await db.collection("users").doc(decoded.uid).get();
  const perfil = callerDoc.data();

  if (!callerDoc.exists || perfil.ativo === false) {
    const err = new Error("Usuário não encontrado ou desativado.");
    err.statusCode = 403;
    throw err;
  }

  return { uid: decoded.uid, profile: perfil };
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
