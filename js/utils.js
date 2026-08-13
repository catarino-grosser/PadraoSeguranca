export const $ = (id) => document.getElementById(id);

export function toast(msg) {
  $("toast").innerText = msg;
  $("toast").classList.remove("hidden");
  setTimeout(() => $("toast").classList.add("hidden"), 3000);
}

export function h(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function norm(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchSearch(obj, term) {
  if (!term) return true;
  return norm(Object.values(obj).join(" ")).includes(norm(term));
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function statusBorder(status) {
  if (status === "Aberto") return "border-red-700";
  if (status === "Em atendimento") return "border-yellow-500";
  if (status === "Finalizado") return "border-green-700";
  if (status === "Cancelado") return "border-slate-400";
  return "border-slate-300";
}

export function statusClass(status) {
  if (status === "Aberto") return "bg-red-100 text-red-800";
  if (status === "Em atendimento") return "bg-yellow-100 text-yellow-800";
  if (status === "Finalizado") return "bg-green-100 text-green-800";
  if (status === "Cancelado") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

export function priorityClass(priority) {
  if (priority === "Crítico") return "bg-red-700 text-white";
  if (priority === "Urgente") return "bg-orange-100 text-orange-800";
  return "bg-blue-100 text-blue-800";
}

/**
 * Desabilita/reabilita um botão durante uma operação assíncrona,
 * evitando duplo-clique (ex: enviar o mesmo alerta de emergência duas vezes).
 * Uso: setLoading(btn, true, "Enviando..."); ... setLoading(btn, false);
 */
export function setLoading(btn, isLoading, loadingText = "Enviando...") {
  if (!btn) return;

  if (isLoading) {
    if (btn.dataset.originalText === undefined) {
      btn.dataset.originalText = btn.innerText;
    }
    btn.disabled = true;
    btn.classList.add("opacity-60", "cursor-not-allowed");
    btn.innerText = loadingText;
  } else {
    btn.disabled = false;
    btn.classList.remove("opacity-60", "cursor-not-allowed");
    if (btn.dataset.originalText !== undefined) {
      btn.innerText = btn.dataset.originalText;
      delete btn.dataset.originalText;
    }
  }
}

/* ---------------------------------------------------------------------- */
/* Modal customizado — substitui window.confirm()/window.prompt()          */
/* Nativos não são confiáveis em WebViews (WhatsApp, Instagram, apps       */
/* embutidos) e não podem ser estilizados. Baseado em Promise.             */
/* ---------------------------------------------------------------------- */

let modalResolver = null;

function showModal({ title, message, showInput = false, inputValue = "", confirmText = "Confirmar", cancelText = "Cancelar" }) {
  return new Promise((resolve) => {
    modalResolver = resolve;

    $("modalTitle").innerText = title;
    $("modalMessage").innerText = message;

    const input = $("modalInput");
    if (showInput) {
      input.classList.remove("hidden");
      input.value = inputValue;
    } else {
      input.classList.add("hidden");
      input.value = "";
    }

    $("modalConfirmBtn").innerText = confirmText;
    $("modalCancelBtn").innerText = cancelText;
    $("modalOverlay").classList.remove("hidden");

    if (showInput) setTimeout(() => input.focus(), 50);
  });
}

function closeModal(confirmed) {
  const input = $("modalInput");
  const result = confirmed ? (input.classList.contains("hidden") ? true : input.value.trim()) : null;

  $("modalOverlay").classList.add("hidden");

  if (modalResolver) {
    modalResolver(result);
    modalResolver = null;
  }
}

/** Substitui window.confirm(). Retorna Promise<boolean>. */
export function customConfirm(message, title = "Confirmar ação") {
  return showModal({ title, message }).then((r) => r === true);
}

/** Substitui window.prompt(). Retorna Promise<string|null> (null = cancelado). */
export function customPrompt(message, defaultValue = "", title = "Informe os detalhes") {
  return showModal({ title, message, showInput: true, inputValue: defaultValue });
}

/** Deve ser chamada uma vez na inicialização do app para ligar os botões do modal. */
export function initModal() {
  $("modalConfirmBtn").addEventListener("click", () => closeModal(true));
  $("modalCancelBtn").addEventListener("click", () => closeModal(false));
  $("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("modalOverlay").classList.contains("hidden")) closeModal(false);
  });
}
