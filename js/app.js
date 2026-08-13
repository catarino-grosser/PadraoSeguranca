import {
  db,
  collection,
  onSnapshot,
  query,
  orderBy,
  where
} from "./firebase.js";

import { state } from "./state.js";
import { $, initModal } from "./utils.js";
import { watchAuth, login, logout } from "./auth.js";

import {
  renderSelects,
  renderCondominiosList,
  renderPortariasList,
  renderUsersList,
  saveCondominio,
  editCondominio,
  toggleCondominio,
  clearCondominioForm,
  savePortaria,
  editPortaria,
  togglePortaria,
  clearPortariaForm,
  saveUserProfile,
  editUser,
  toggleUser,
  clearUserForm
} from "./admin.js";

import {
  criarAlerta,
  renderCounts,
  renderAlertas,
  aceitarAlerta,
  finalizarAlerta,
  cancelarAlerta
} from "./alertas.js";

export function applyRoleUI() {
  $("btnAdmin").classList.toggle("hidden", state.currentProfile.role !== "adm");
  $("porteiroBox").classList.toggle("hidden", state.currentProfile.role !== "porteiro");
  $("vigilanteBox").classList.toggle("hidden", state.currentProfile.role !== "vigilante");
  $("adminBox").classList.toggle("hidden", state.currentProfile.role !== "adm");

  showPanel("dashboard");
}

export function showPanel(panel) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
  $(`${panel}Panel`).classList.remove("hidden");

  document.querySelectorAll(".menu-btn").forEach((btn) => btn.classList.remove("active"));

  if (panel === "dashboard") $("btnDashboard").classList.add("active");
  if (panel === "alertas") $("btnAlertas").classList.add("active");
  if (panel === "admin") $("btnAdmin").classList.add("active");

  const titles = {
    dashboard: ["Painel operacional", "Monitoramento em tempo real dos chamados."],
    alertas: ["Alertas de segurança", "Lista operacional de ocorrências."],
    admin: ["Administração", "Gerencie condomínios, portarias e funcionários."]
  };

  $("pageTitle").innerText = titles[panel][0];
  $("pageSubtitle").innerText = titles[panel][1];
}

/**
 * Inicia os listeners em tempo real, escopados de acordo com o papel do
 * usuário logado. Isso evita que o navegador de um porteiro baixe alertas
 * de outros condomínios, ou que qualquer usuário não-admin baixe a lista
 * completa de funcionários — o filtro deixa de ser só visual (no JS) e
 * passa a ser reforçado também pelas Firestore Security Rules.
 *
 * Todas as funções de unsubscribe são guardadas em state.unsubscribers
 * e devem ser chamadas no logout (ver auth.js) para não duplicar listeners
 * em ciclos de login/logout na mesma aba.
 */
export function startRealtime() {
  const unsubs = [];
  const role = state.currentProfile.role;

  unsubs.push(
    onSnapshot(
      collection(db, "condominios"),
      (snap) => {
        state.condominios = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderAll();
      },
      (err) => console.error("Listener condominios:", err)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, "portarias"),
      (snap) => {
        state.portarias = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderAll();
      },
      (err) => console.error("Listener portarias:", err)
    )
  );

  // Só o ADM precisa (e só o ADM tem permissão, pelas regras) de ler a
  // coleção inteira de funcionários.
  if (role === "adm") {
    unsubs.push(
      onSnapshot(
        collection(db, "users"),
        (snap) => {
          state.users = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          renderUsersList();
        },
        (err) => console.error("Listener users:", err)
      )
    );
  }

  // Porteiro só pode (e só deve) ver os próprios alertas — a query já
  // vem filtrada do Firestore, e a Security Rule exige esse filtro.
  // ADM e vigilante veem todos os alertas, ordenados pelos mais recentes.
  const alertasRef = collection(db, "alertas");
  const alertasQuery =
    role === "porteiro"
      ? query(alertasRef, where("porteiroId", "==", state.currentUser.uid))
      : query(alertasRef, orderBy("criadoEm", "desc"));

  unsubs.push(
    onSnapshot(
      alertasQuery,
      (snap) => {
        let lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Sem orderBy no servidor para a query do porteiro (evita exigir um
        // índice composto porteiroId+criadoEm) — ordena no cliente.
        if (role === "porteiro") {
          lista = lista.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
        }

        state.alertas = lista;
        renderAlertas();
        renderCounts();
      },
      (err) => console.error("Listener alertas:", err)
    )
  );

  state.unsubscribers = unsubs;
}

function renderAll() {
  renderSelects();
  renderCondominiosList();
  renderPortariasList();
  renderUsersList();
}

Object.assign(window, {
  login,
  logout,
  showPanel,

  saveCondominio,
  editCondominio,
  toggleCondominio,
  clearCondominioForm,

  savePortaria,
  editPortaria,
  togglePortaria,
  clearPortariaForm,

  saveUserProfile,
  editUser,
  toggleUser,
  clearUserForm,

  criarAlerta,
  renderAlertas,
  aceitarAlerta,
  finalizarAlerta,
  cancelarAlerta,

  renderCondominiosList,
  renderPortariasList,
  renderUsersList
});

initModal();
watchAuth();
