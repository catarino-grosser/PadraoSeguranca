# Padrão Segurança - Central Operacional v1.2.1

## Correções da v1.2.1

- Corrige cards de alertas que apareciam quase vazios.
- Alertas agora tentam mostrar dados por nome direto e, se faltar, buscam por ID:
  - condomínio
  - portaria
  - endereço
  - porteiro
  - vigilante
- Listas de condomínios, portarias e funcionários agora mostram textos de fallback:
  - Não informado
  - Não vinculado
  - Endereço não informado
- Mantém FirebaseConfig já configurado em `js/firebase.js`.

## Deploy

Substitua a versão anterior no GitHub e publique no Netlify.
