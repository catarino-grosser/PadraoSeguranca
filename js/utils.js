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
