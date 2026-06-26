import {
  db,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp
} from "./firebase.js";

import { state } from "./state.js";
import { $, h, matchSearch, scrollToTop, toast } from "./utils.js";
import { showPanel } from "./app.js";

export function renderSelects() {
  const activeConds = state.condominios.filter((c) => c.ativo !== false);
  const activePorts = state.portarias.filter((p) => p.ativo !== false);

  const condOptions = activeConds
    .map((c) => `<option value="${c.id}">${h(c.nome)}</option>`)
    .join("");

  $("portCondominio").innerHTML = condOptions || '<option value="">Cadastre um condomínio</option>';
  $("userCondominio").innerHTML = '<option value="">Nenhum</option>' + condOptions;

  $("userPortaria").innerHTML =
    '<option value="">Nenhuma</option>' +
    activePorts
      .map((p) => `<option value="${p.id}">${h(p.nome)} - ${h(getCondominioName(p.condominioId))}</option>`)
      .join("");
}

export async function saveCondominio() {
  const id = $("condEditId").value;
  const nome = $("condNome").value.trim();
  const endereco = $("condEndereco").value.trim();
  const cidade = $("condCidade").value.trim();

  if (!nome || !endereco) {
    toast("Informe nome e endereço.");
    return;
  }

  const data = {
    nome,
    endereco,
    cidade,
    ativo: true,
    atualizadoEm: serverTimestamp()
  };

  if (id) {
    await updateDoc(doc(db, "condominios", id), data);
    toast("Condomínio atualizado.");
  } else {
    await addDoc(collection(db, "condominios"), {
      ...data,
      criadoEm: serverTimestamp()
    });
    toast("Condomínio salvo.");
  }

  clearCondominioForm();
}

export function editCondominio(id) {
  const c = state.condominios.find((item) => item.id === id);
  if (!c) return;

  $("condEditId").value = c.id;
  $("condNome").value = c.nome || "";
  $("condEndereco").value = c.endereco || "";
  $("condCidade").value = c.cidade || "";
  $("condFormTitle").innerText = "Editar condomínio";

  showPanel("admin");
  scrollToTop();
}

export async function toggleCondominio(id, ativo) {
  await updateDoc(doc(db, "condominios", id), {
    ativo: !ativo,
    atualizadoEm: serverTimestamp()
  });

  toast(!ativo ? "Condomínio ativado." : "Condomínio desativado.");
}

export function clearCondominioForm() {
  $("condEditId").value = "";
  $("condNome").value = "";
  $("condEndereco").value = "";
  $("condCidade").value = "";
  $("condFormTitle").innerText = "Cadastrar condomínio";
}

export async function savePortaria() {
  const id = $("portEditId").value;
  const condominioId = $("portCondominio").value;
  const nome = $("portNome").value.trim();
  const endereco = $("portEndereco").value.trim();
  const referencia = $("portReferencia").value.trim();

  if (!condominioId || !nome || !endereco) {
    toast("Informe condomínio, nome e endereço.");
    return;
  }

  const data = {
    condominioId,
    nome,
    endereco,
    referencia,
    ativo: true,
    atualizadoEm: serverTimestamp()
  };

  if (id) {
    await updateDoc(doc(db, "portarias", id), data);
    toast("Portaria atualizada.");
  } else {
    await addDoc(collection(db, "portarias"), {
      ...data,
      criadoEm: serverTimestamp()
    });
    toast("Portaria salva.");
  }

  clearPortariaForm();
}

export function editPortaria(id) {
  const p = state.portarias.find((item) => item.id === id);
  if (!p) return;

  $("portEditId").value = p.id;
  $("portCondominio").value = p.condominioId || "";
  $("portNome").value = p.nome || "";
  $("portEndereco").value = p.endereco || "";
  $("portReferencia").value = p.referencia || "";
  $("portFormTitle").innerText = "Editar portaria";

  showPanel("admin");
  scrollToTop();
}

export async function togglePortaria(id, ativo) {
  await updateDoc(doc(db, "portarias", id), {
    ativo: !ativo,
    atualizadoEm: serverTimestamp()
  });

  toast(!ativo ? "Portaria ativada." : "Portaria desativada.");
}

export function clearPortariaForm() {
  $("portEditId").value = "";
  $("portNome").value = "";
  $("portEndereco").value = "";
  $("portReferencia").value = "";
  $("portFormTitle").innerText = "Cadastrar portaria";
}

export async function saveUserProfile() {
  const uid = $("userUid").value.trim();
  const nome = $("userNome").value.trim();
  const email = $("userEmail").value.trim();
  const role = $("userRole").value;
  const condominioId = $("userCondominio").value || null;
  const portariaId = $("userPortaria").value || null;

  if (!uid || !nome || !email || !role) {
    toast("Informe UID, nome, e-mail e perfil.");
    return;
  }

  await setDoc(
    doc(db, "users", uid),
    {
      nome,
      email,
      role,
      condominioId,
      portariaId,
      ativo: true,
      atualizadoEm: serverTimestamp()
    },
    { merge: true }
  );

  clearUserForm();
  toast("Funcionário salvo.");
}

export function editUser(id) {
  const u = state.users.find((item) => item.id === id);
  if (!u) return;

  $("userUid").value = u.id;
  $("userUid").readOnly = true;
  $("userUid").classList.add("bg-slate-100");
  $("userNome").value = u.nome || "";
  $("userEmail").value = u.email || "";
  $("userRole").value = u.role || "porteiro";
  $("userCondominio").value = u.condominioId || "";
  $("userPortaria").value = u.portariaId || "";
  $("userFormTitle").innerText = "Editar funcionário";

  showPanel("admin");
  scrollToTop();
}

export async function toggleUser(id, ativo) {
  if (id === state.currentUser.uid && ativo) {
    toast("Você não pode desativar seu próprio usuário.");
    return;
  }

  await updateDoc(doc(db, "users", id), {
    ativo: !ativo,
    atualizadoEm: serverTimestamp()
  });

  toast(!ativo ? "Funcionário ativado." : "Funcionário desativado.");
}

export function clearUserForm() {
  $("userUid").value = "";
  $("userUid").readOnly = false;
  $("userUid").classList.remove("bg-slate-100");
  $("userNome").value = "";
  $("userEmail").value = "";
  $("userRole").value = "adm";
  $("userCondominio").value = "";
  $("userPortaria").value = "";
  $("userFormTitle").innerText = "Cadastrar/editar funcionário";
}

export function renderCondominiosList() {
  const box = $("condominiosList");
  if (!box) return;

  const term = $("searchConds")?.value || "";
  const list = state.condominios.filter((c) => matchSearch(c, term));

  box.innerHTML =
    list
      .map(
        (c) => `
        <div class="record-card ${c.ativo === false ? "inactive" : ""}">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-black">${h(c.nome)}</p>
              <p class="text-sm text-slate-600">${h(c.endereco)}</p>
              <p class="text-sm text-slate-600">${h(c.cidade)}</p>
            </div>
            <span class="badge ${c.ativo === false ? "badge-inactive" : "badge-active"}">
              ${c.ativo === false ? "Desativado" : "Ativo"}
            </span>
          </div>
          <div class="flex gap-2 mt-3">
            <button onclick="editCondominio('${c.id}')" class="action-btn btn-blue">Editar</button>
            <button onclick="toggleCondominio('${c.id}', ${c.ativo !== false})" class="action-btn btn-dark">
              ${c.ativo === false ? "Ativar" : "Desativar"}
            </button>
          </div>
        </div>
      `
      )
      .join("") || '<p class="text-slate-500">Nenhum condomínio encontrado.</p>';
}

export function renderPortariasList() {
  const box = $("portariasList");
  if (!box) return;

  const term = $("searchPorts")?.value || "";
  const list = state.portarias.filter((p) =>
    matchSearch({ ...p, condominio: getCondominioName(p.condominioId) }, term)
  );

  box.innerHTML =
    list
      .map(
        (p) => `
        <div class="record-card ${p.ativo === false ? "inactive" : ""}">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-black">${h(p.nome)}</p>
              <p class="text-sm text-slate-600">${h(getCondominioName(p.condominioId))}</p>
              <p class="text-sm text-slate-600">${h(p.endereco)}</p>
              <p class="text-sm text-slate-600">${h(p.referencia)}</p>
            </div>
            <span class="badge ${p.ativo === false ? "badge-inactive" : "badge-active"}">
              ${p.ativo === false ? "Desativada" : "Ativa"}
            </span>
          </div>
          <div class="flex gap-2 mt-3">
            <button onclick="editPortaria('${p.id}')" class="action-btn btn-blue">Editar</button>
            <button onclick="togglePortaria('${p.id}', ${p.ativo !== false})" class="action-btn btn-dark">
              ${p.ativo === false ? "Ativar" : "Desativar"}
            </button>
          </div>
        </div>
      `
      )
      .join("") || '<p class="text-slate-500">Nenhuma portaria encontrada.</p>';
}

export function renderUsersList() {
  const box = $("usersList");
  if (!box) return;

  const term = $("searchUsers")?.value || "";
  const list = state.users.filter((u) =>
    matchSearch(
      {
        ...u,
        condominio: getCondominioName(u.condominioId),
        portaria: getPortariaName(u.portariaId)
      },
      term
    )
  );

  box.innerHTML =
    list
      .map(
        (u) => `
        <div class="record-card ${u.ativo === false ? "inactive" : ""}">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-black">${h(u.nome)}</p>
              <p class="text-sm text-slate-600">${h(u.email)}</p>
              <p class="text-sm"><strong>Perfil:</strong> ${h(u.role)}</p>
              <p class="text-sm"><strong>Condomínio:</strong> ${h(getCondominioName(u.condominioId))}</p>
              <p class="text-sm"><strong>Portaria:</strong> ${h(getPortariaName(u.portariaId))}</p>
            </div>
            <span class="badge ${u.ativo === false ? "badge-inactive" : "badge-active"}">
              ${u.ativo === false ? "Desativado" : "Ativo"}
            </span>
          </div>
          <div class="flex gap-2 mt-3">
            <button onclick="editUser('${u.id}')" class="action-btn btn-blue">Editar</button>
            <button onclick="toggleUser('${u.id}', ${u.ativo !== false})" class="action-btn btn-dark">
              ${u.ativo === false ? "Ativar" : "Desativar"}
            </button>
          </div>
        </div>
      `
      )
      .join("") || '<p class="text-slate-500">Nenhum funcionário encontrado.</p>';
}

export function getCondominioName(id) {
  if (!id) return "Não vinculado";
  const c = state.condominios.find((item) => item.id === id);
  return c ? c.nome : "Não encontrado";
}

export function getPortariaName(id) {
  if (!id) return "Não vinculada";
  const p = state.portarias.find((item) => item.id === id);
  return p ? p.nome : "Não encontrada";
}
