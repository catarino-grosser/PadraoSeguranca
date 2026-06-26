import {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc
} from "./firebase.js";

import { state } from "./state.js";
import { $, toast } from "./utils.js";
import { applyRoleUI, startRealtime } from "./app.js";

export async function login() {
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value.trim();

  if (!email || !password) {
    toast("Informe e-mail e senha.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);
    toast("Erro ao entrar. Confira e-mail e senha.");
  }
}

export async function logout() {
  await signOut(auth);
}

export function watchAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      state.currentUser = null;
      state.currentProfile = null;
      state.realtimeStarted = false;
      $("loginView").classList.remove("hidden");
      $("appView").classList.add("hidden");
      return;
    }

    state.currentUser = user;

    const profileSnap = await getDoc(doc(db, "users", user.uid));

    if (!profileSnap.exists()) {
      toast("Usuário autenticado, mas sem perfil no Firestore.");
      await signOut(auth);
      return;
    }

    state.currentProfile = { id: user.uid, ...profileSnap.data() };

    if (state.currentProfile.ativo === false) {
      toast("Usuário desativado.");
      await signOut(auth);
      return;
    }

    $("loginView").classList.add("hidden");
    $("appView").classList.remove("hidden");
    $("userInfo").innerText = `${state.currentProfile.nome} | ${state.currentProfile.role}`;

    applyRoleUI();

    if (!state.realtimeStarted) {
      startRealtime();
      state.realtimeStarted = true;
    }
  });
}
