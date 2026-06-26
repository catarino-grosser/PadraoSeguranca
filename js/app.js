import {
  db,
  collection,
  onSnapshot,
  query,
  orderBy
} from "./firebase.js";

import { state } from "./state.js";
import { $ } from "./utils.js";
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

export function startRealtime() {
  onSnapshot(collection(db, "condominios"), (snap) => {
    state.condominios = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderAll();
  });

  onSnapshot(collection(db, "portarias"), (snap) => {
    state.portarias = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderAll();
  });

  onSnapshot(collection(db, "users"), (snap) => {
    state.users = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderUsersList();
  });

  onSnapshot(query(collection(db, "alertas"), orderBy("criadoEm", "desc")), (snap) => {
    state.alertas = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderAlertas();
    renderCounts();
  });
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

watchAuth();
