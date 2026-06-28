# Padrão Segurança - Central Operacional v1.1

Projeto web para Netlify + GitHub + Firebase Authentication + Firestore.

## Estrutura

```txt
padrao-seguranca-v1-1/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── admin.js
│   ├── alertas.js
│   ├── app.js
│   ├── auth.js
│   ├── firebase.js
│   ├── state.js
│   └── utils.js
└── img/
```

## Deploy

1. Envie todos os arquivos para o GitHub.
2. Conecte o repositório ao Netlify.
3. O arquivo principal é `index.html`.

## Firebase

O arquivo `js/firebase.js` já contém o FirebaseConfig informado.

## Perfis

- `adm`
- `porteiro`
- `vigilante`

## Firestore

Coleções usadas:

- `users`
- `condominios`
- `portarias`
- `alertas`
