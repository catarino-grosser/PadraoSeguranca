import {
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp
} from "./firebase.js";

import { state } from "./state.js";
import { getCondominioName, getPortariaName, getPortariaAddress, getUserName, info } from "./admin.js";
import {
  $,
  h,
  matchSearch,
  priorityClass,
  statusBorder,
  statusClass,
  toast
} from "./utils.js";

import { getCondominioName, getPortariaName } from "./admin.js";

export async function criarAlerta() {
  if (state.currentProfile.role !== "porteiro") {
    toast("Apenas porteiros podem criar alertas.");
    return;
  }

  const portaria = state.portarias.find(
    (p) => p.id === state.currentProfile.portariaId && p.ativo !== false
  );

  const condominio = state.condominios.find(
    (c) => c.id === state.currentProfile.condominioId && c.ativo !== false
  );

  if (!portaria || !condominio) {
    toast("Seu usuário precisa estar vinculado a condomínio e portaria ativos.");
    return;
  }

  await addDoc(collection(db, "alertas"), {
    condominioId: condominio.id,
    condominioNome: condominio.nome,
    portariaId: portaria.id,
    portariaNome: portaria.nome,
    endereco: portaria.endereco || condominio.endereco,
    porteiroId: state.currentUser.uid,
    porteiroNome: state.currentProfile.nome,
    prioridade: $("alertaPrioridade").value,
    observacao: $("alertaObservacao").value.trim(),
    status: "Aberto",
    vigilanteId: null,
    vigilanteNome: null,
    criadoEm: serverTimestamp(),
    aceitoEm: null,
    finalizadoEm: null,
    canceladoEm: null
  });

  $("alertaObservacao").value = "";
  toast("Alerta enviado para a base.");
}

export function renderCounts() {
  $("countAberto").innerText = state.alertas.filter((a) => a.status === "Aberto").length;
  $("countAtendimento").innerText = state.alertas.filter((a) => a.status === "Em atendimento").length;
  $("countFinalizado").innerText = state.alertas.filter((a) => a.status === "Finalizado").length;
}

export function renderAlertas() {
  let lista = state.alertas;

  if (state.currentProfile?.role === "porteiro") {
    lista = lista.filter((a) => a.porteiroId === state.currentUser.uid);
  }

  const term = $("searchAlertas")?.value || "";
  lista = lista.filter((a) => matchSearch(a, term));

  $("alertasList").innerHTML =
    lista.map(alertaCard).join("") ||
    '<div class="soft-card rounded-3xl p-5 text-slate-500">Nenhum alerta encontrado.</div>';
}

function alertaCard(alerta) {
  const condominioNome = info(alerta.condominioNome, getCondominioName(alerta.condominioId));
  const portariaNome = info(alerta.portariaNome, getPortariaName(alerta.portariaId));
  const endereco = info(alerta.endereco, getPortariaAddress(alerta.portariaId) || alerta.endereco || "");
  const porteiroNome = info(alerta.porteiroNome, getUserName(alerta.porteiroId));
  const vigilanteNome = info(alerta.vigilanteNome, getUserName(alerta.vigilanteId));
  const prioridade = info(alerta.prioridade, "Normal");
  const status = info(alerta.status, "Status não informado");
  const observacao = info(alerta.observacao, "Sem observação inicial");
  const resumoFinal = info(alerta.resumoFinal, "");

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco || "")}`;

  const canAccept = state.currentProfile.role === "vigilante" && alerta.status === "Aberto";
  const canFinish =
    state.currentProfile.role === "vigilante" &&
    alerta.status === "Em atendimento" &&
    alerta.vigilanteId === state.currentUser.uid;

  const canCancel =
    state.currentProfile.role === "porteiro" &&
    alerta.status === "Aberto" &&
    alerta.porteiroId === state.currentUser.uid;

  return `
    <article class="soft-card rounded-3xl p-5 border-l-8 ${statusBorder(status)}">
      <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <span class="px-3 py-1 rounded-full text-sm font-black ${priorityClass(prioridade)}">
              ${h(prioridade)}
            </span>
            <span class="px-3 py-1 rounded-full text-sm font-black ${statusClass(status)}">
              ${h(status)}
            </span>
          </div>

          <p class="text-lg font-black">${h(condominioNome)}</p>
          <p><strong>Portaria:</strong> ${h(portariaNome)}</p>
          <p><strong>Endereço:</strong> ${h(endereco || "Endereço não informado")}</p>
          <p><strong>Porteiro:</strong> ${h(porteiroNome)}</p>
          <p><strong>Vigilante:</strong> ${h(vigilanteNome)}</p>
          <p class="mt-2 text-slate-700"><strong>Observação:</strong> ${h(observacao)}</p>
          ${resumoFinal ? `<p class="mt-2 text-slate-700"><strong>Resumo final:</strong> ${h(resumoFinal)}</p>` : ""}
        </div>

        <div class="grid gap-2 min-w-56">
          <a href="${mapsUrl}" target="_blank" class="text-center bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-2xl font-black">
            📍 Abrir rota
          </a>

          ${
            canAccept
              ? `<button onclick="aceitarAlerta('${alerta.id}')" class="bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-2xl font-black">Aceitar alerta</button>`
              : ""
          }

          ${
            canFinish
              ? `<button onclick="finalizarAlerta('${alerta.id}')" class="bg-slate-950 hover:bg-slate-800 text-white px-4 py-3 rounded-2xl font-black">Finalizar operação</button>`
              : ""
          }

          ${
            canCancel
              ? `<button onclick="cancelarAlerta('${alerta.id}')" class="bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-2xl font-black">Cancelar alerta</button>`
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

export async function aceitarAlerta(id) {
  if (!confirm("Aceitar este alerta e iniciar deslocamento?")) return;

  await updateDoc(doc(db, "alertas", id), {
    status: "Em atendimento",
    vigilanteId: state.currentUser.uid,
    vigilanteNome: state.currentProfile.nome,
    aceitoEm: serverTimestamp()
  });

  toast("Alerta aceito.");
}

export async function finalizarAlerta(id) {
  const resumo = prompt("Resumo da operação:", "Atendimento finalizado no local.");

  await updateDoc(doc(db, "alertas", id), {
    status: "Finalizado",
    resumoFinal: resumo || "",
    finalizadoEm: serverTimestamp()
  });

  toast("Operação finalizada.");
}

export async function cancelarAlerta(id) {
  if (!confirm("Cancelar este alerta?")) return;

  await updateDoc(doc(db, "alertas", id), {
    status: "Cancelado",
    canceladoEm: serverTimestamp()
  });

  toast("Alerta cancelado.");
}

export { getCondominioName, getPortariaName };
