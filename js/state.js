export const state = {
  currentUser: null,
  currentProfile: null,
  condominios: [],
  portarias: [],
  alertas: [],
  users: [],
  realtimeStarted: false,
  // Guarda as funções de unsubscribe de todos os onSnapshot ativos.
  // São chamadas no logout para evitar listeners duplicados/vazamento de memória.
  unsubscribers: []
};
