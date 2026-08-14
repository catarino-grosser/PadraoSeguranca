import {
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp
} from "./firebase.js";

import { state } from "./state.js";
import { $, h, matchSearch, scrollToTop, toast, setLoading } from "./utils.js";
import { callFunction } from "./netlifyFunctions.js";
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

export async function saveCondominio(btn) {
  const id = $("condEditId").value;
  const nome = $("condNome").value.trim();
  const endereco = $("condEndereco").value.trim();
  const cidade = $("condCidade").value.trim();
  const telefone = $("condTelefone").value.trim();

  if (!nome || !endereco) {
    toast("Informe nome e endereço.");
    return;
  }

  const data = {
    nome,
    endereco,
    cidade,
    telefone,
    ativo: true,
    atualizadoEm: serverTimestamp()
  };

  setLoading(btn, true, "Salvando...");
  try {
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
  } catch (err) {
    console.error("saveCondominio:", err);
    toast("Erro ao salvar condomínio. Tente novamente.");
  } finally {
    setLoading(btn, false);
  }
}

export function editCondominio(id) {
  const c = state.condominios.find((item) => item.id === id);
  if (!c) return;

  $("condEditId").value = c.id;
  $("condNome").value = c.nome || "";
  $("condEndereco").value = c.endereco || "";
  $("condCidade").value = c.cidade || "";
  $("condTelefone").value = c.telefone || "";
  $("condFormTitle").innerText = "Editar condomínio";

  showPanel("admin");
  scrollToTop();
}

export async function toggleCondominio(id, ativo) {
  try {
    await updateDoc(doc(db, "condominios", id), {
      ativo: !ativo,
      atualizadoEm: serverTimestamp()
    });
    toast(!ativo ? "Condomínio ativado." : "Condomínio desativado.");
  } catch (err) {
    console.error("toggleCondominio:", err);
    toast("Erro ao atualizar condomínio.");
  }
}

export function clearCondominioForm() {
  $("condEditId").value = "";
  $("condNome").value = "";
  $("condEndereco").value = "";
  $("condCidade").value = "";
  $("condTelefone").value = "";
  $("condFormTitle").innerText = "Cadastrar condomínio";
}

export async function savePortaria(btn) {
  const id = $("portEditId").value;
  const condominioId = $("portCondominio").value;
  const nome = $("portNome").value.trim();
  const endereco = $("portEndereco").value.trim();
  const referencia = $("portReferencia").value.trim();
  const telefone = $("portTelefone").value.trim();

  if (!condominioId || !nome || !endereco) {
    toast("Informe condomínio, nome e endereço.");
    return;
  }

  const data = {
    condominioId,
    nome,
    endereco,
    referencia,
    telefone,
    ativo: true,
    atualizadoEm: serverTimestamp()
  };

  setLoading(btn, true, "Salvando...");
  try {
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
  } catch (err) {
    console.error("savePortaria:", err);
    toast("Erro ao salvar portaria. Tente novamente.");
  } finally {
    setLoading(btn, false);
  }
}

export function editPortaria(id) {
  const p = state.portarias.find((item) => item.id === id);
  if (!p) return;

  $("portEditId").value = p.id;
  $("portCondominio").value = p.condominioId || "";
  $("portNome").value = p.nome || "";
  $("portEndereco").value = p.endereco || "";
  $("portReferencia").value = p.referencia || "";
  $("portTelefone").value = p.telefone || "";
  $("portFormTitle").innerText = "Editar portaria";

  showPanel("admin");
  scrollToTop();
}

export async function togglePortaria(id, ativo) {
  try {
    await updateDoc(doc(db, "portarias", id), {
      ativo: !ativo,
      atualizadoEm: serverTimestamp()
    });
    toast(!ativo ? "Portaria ativada." : "Portaria desativada.");
  } catch (err) {
    console.error("togglePortaria:", err);
    toast("Erro ao atualizar portaria.");
  }
}

export function clearPortariaForm() {
  $("portEditId").value = "";
  $("portNome").value = "";
  $("portEndereco").value = "";
  $("portReferencia").value = "";
  $("portTelefone").value = "";
  $("portFormTitle").innerText = "Cadastrar portaria";
}

export async function saveUserProfile(btn) {
  const editId = $("userEditId").value;
  const nome = $("userNome").value.trim();
  const email = $("userEmail").value.trim();
  const telefone = $("userTelefone").value.trim();
  const senha = $("userSenha").value;
  const role = $("userRole").value;
  const condominioId = $("userCondominio").value || null;
  const portariaId = $("userPortaria").value || null;

  if (!nome || !email || !role) {
    toast("Informe nome, e-mail e perfil.");
    return;
  }

  setLoading(btn, true, "Salvando...");
  try {
    if (editId) {
      // Edição: só atualiza os dados no Firestore. Trocar a senha ou o
      // e-mail de login continua sendo feito direto no Firebase Auth.
      await updateDoc(doc(db, "users", editId), {
        nome,
        email,
        telefone,
        role,
        condominioId,
        portariaId,
        atualizadoEm: serverTimestamp()
      });
      toast("Funcionário atualizado.");
    } else {
      // Novo funcionário: a Netlify Function cria a conta no Auth, o
      // perfil no Firestore e o Custom Claim do papel, tudo de uma vez.
      if (!senha || senha.length < 6) {
        toast("Defina uma senha temporária com pelo menos 6 caracteres.");
        return;
      }

      await callFunction("criar-funcionario", {
        nome,
        email,
        telefone,
        senha,
        role,
        condominioId,
        portariaId
      });
      toast("Funcionário criado com sucesso.");
    }

    clearUserForm();
  } catch (err) {
    console.error("saveUserProfile:", err);
    toast(err.message || "Erro ao salvar funcionário. Tente novamente.");
  } finally {
    setLoading(btn, false);
  }
}

export function editUser(id) {
  const u = state.users.find((item) => item.id === id);
  if (!u) return;

  $("userEditId").value = u.id;
  $("userEditHint").innerText = `Editando: ${u.email} (UID ${u.id})`;
  $("userEditHint").classList.remove("hidden");
  $("userSenhaWrapper").classList.add("hidden");
  $("userSenha").value = "";

  $("userNome").value = u.nome || "";
  $("userEmail").value = u.email || "";
  $("userTelefone").value = u.telefone || "";
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

  try {
    await updateDoc(doc(db, "users", id), {
      ativo: !ativo,
      atualizadoEm: serverTimestamp()
    });
    toast(!ativo ? "Funcionário ativado." : "Funcionário desativado.");
  } catch (err) {
    console.error("toggleUser:", err);
    toast("Erro ao atualizar funcionário.");
  }
}

export function clearUserForm() {
  $("userEditId").value = "";
  $("userEditHint").classList.add("hidden");
  $("userSenhaWrapper").classList.remove("hidden");
  $("userSenha").value = "";
  $("userNome").value = "";
  $("userEmail").value = "";
  $("userTelefone").value = "";
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
      .map((c) => {
        const portariasVinculadas = state.portarias.filter((p) => p.condominioId === c.id);
        const funcionariosVinculados = state.users.filter((u) => u.condominioId === c.id);

        return `
        <div class="record-card ${c.ativo === false ? "inactive" : ""}">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-black">${h(c.nome)}</p>
              <p class="text-sm text-slate-600">${h(c.endereco)}</p>
              <p class="text-sm text-slate-600">${h(c.cidade)}</p>
              <p class="text-sm text-slate-600">📞 ${h(c.telefone || "Telefone não informado")}</p>
            </div>
            <span class="badge ${c.ativo === false ? "badge-inactive" : "badge-active"}">
              ${c.ativo === false ? "Desativado" : "Ativo"}
            </span>
          </div>
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="count-pill">${portariasVinculadas.length} portaria(s)</span>
            <span class="count-pill">${funcionariosVinculados.length} funcionário(s)</span>
          </div>
          <div class="flex gap-2 mt-3">
            <button onclick="editCondominio('${c.id}')" class="action-btn btn-blue">Editar</button>
            <button onclick="toggleCondominio('${c.id}', ${c.ativo !== false})" class="action-btn btn-dark">
              ${c.ativo === false ? "Ativar" : "Desativar"}
            </button>
          </div>
        </div>
      `;
      })
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
      .map((p) => {
        const funcionariosVinculados = state.users.filter((u) => u.portariaId === p.id);

        return `
        <div class="record-card ${p.ativo === false ? "inactive" : ""}">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-black">${h(p.nome)}</p>
              <p class="text-sm text-slate-600">${h(getCondominioName(p.condominioId))}</p>
              <p class="text-sm text-slate-600">${h(p.endereco)}</p>
              <p class="text-sm text-slate-600">${h(p.referencia)}</p>
              <p class="text-sm text-slate-600">📞 ${h(p.telefone || "Telefone não informado")}</p>
            </div>
            <span class="badge ${p.ativo === false ? "badge-inactive" : "badge-active"}">
              ${p.ativo === false ? "Desativada" : "Ativa"}
            </span>
          </div>
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="count-pill">${funcionariosVinculados.length} funcionário(s) vinculado(s)</span>
          </div>
          <div class="flex gap-2 mt-3">
            <button onclick="editPortaria('${p.id}')" class="action-btn btn-blue">Editar</button>
            <button onclick="togglePortaria('${p.id}', ${p.ativo !== false})" class="action-btn btn-dark">
              ${p.ativo === false ? "Ativar" : "Desativar"}
            </button>
          </div>
        </div>
      `;
      })
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
              <p class="text-sm text-slate-600">📞 ${h(u.telefone || "Telefone não informado")}</p>
              <p class="text-sm"><strong>Perfil:</strong> ${h(roleLabel(u.role))}</p>
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

function roleLabel(role) {
  if (role === "adm") return "Administrador";
  if (role === "porteiro") return "Porteiro";
  if (role === "vigilante") return "Vigilante";
  return role || "Não definido";
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
