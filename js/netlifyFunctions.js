import { state } from "./state.js";

/**
 * Chama uma Netlify Function (em /.netlify/functions/{name}) enviando o
 * token de ID do Firebase do usuário logado no header Authorization.
 *
 * IMPORTANTE: as functions só existem depois de um deploy real no Netlify —
 * não funcionam ao abrir o index.html localmente ou na pré-visualização do
 * Spck Editor.
 */
export async function callFunction(name, body = {}) {
  if (!state.currentUser) {
    throw new Error("Você precisa estar logado.");
  }

  const idToken = await state.currentUser.getIdToken();

  const res = await fetch(`/.netlify/functions/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify(body)
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    // resposta sem corpo JSON — segue com data={}
  }

  if (!res.ok) {
    throw new Error(data.error || `Erro ao chamar ${name}.`);
  }

  return data;
}
