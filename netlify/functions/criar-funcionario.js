import { auth, db, FieldValue, requireAdmin, jsonResponse } from "./_shared/firebaseAdmin.js";

const PAPEIS_VALIDOS = ["adm", "porteiro", "vigilante"];

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    await requireAdmin(req);

    const { nome, email, telefone, senha, role, condominioId, portariaId } = await req.json();

    if (!nome || !email || !senha || !role) {
      return jsonResponse({ error: "Informe nome, e-mail, senha e perfil." }, 400);
    }
    if (senha.length < 6) {
      return jsonResponse({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);
    }
    if (!PAPEIS_VALIDOS.includes(role)) {
      return jsonResponse({ error: "Perfil inválido." }, 400);
    }

    // 1) Cria a conta no Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password: senha,
      displayName: nome
    });

    // 2) Define o papel como Custom Claim (fica disponível no token de ID)
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // 3) Cria o perfil no Firestore — mesma coleção/campos que o app já usa
    await db
      .collection("users")
      .doc(userRecord.uid)
      .set({
        nome,
        email,
        telefone: telefone || "",
        role,
        condominioId: condominioId || null,
        portariaId: portariaId || null,
        ativo: true,
        criadoEm: FieldValue.serverTimestamp(),
        atualizadoEm: FieldValue.serverTimestamp()
      });

    return jsonResponse({ uid: userRecord.uid });
  } catch (err) {
    console.error("criar-funcionario:", err);

    if (err.code === "auth/email-already-exists") {
      return jsonResponse({ error: "Já existe um usuário com este e-mail." }, 409);
    }
    if (err.code === "auth/invalid-password" || err.code === "auth/weak-password") {
      return jsonResponse({ error: "Senha inválida (mínimo 6 caracteres)." }, 400);
    }
    if (err.code === "auth/invalid-email") {
      return jsonResponse({ error: "E-mail inválido." }, 400);
    }

    return jsonResponse({ error: err.message || "Erro ao criar funcionário." }, err.statusCode || 500);
  }
};
