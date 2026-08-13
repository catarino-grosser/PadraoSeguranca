# Padrão Segurança - Central Operacional v1.3

Projeto web para Netlify + GitHub + Firebase Authentication + Firestore.

## Estrutura

```txt
padrao-seguranca/
├── index.html
├── firestore.rules
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

## Deploy do site (Netlify + GitHub)

1. Envie todos os arquivos para o GitHub.
2. Conecte o repositório ao Netlify.
3. O arquivo principal é `index.html` (ele carrega `css/style.css` e `js/app.js`).

## Deploy das Firestore Security Rules (IMPORTANTE)

O arquivo `firestore.rules` **não é enviado automaticamente** com o site — ele
precisa ser publicado separadamente no Firebase. Sem isso, qualquer usuário
autenticado pode escrever diretamente no banco pelo console do navegador
(inclusive virar admin), porque hoje a única checagem de papel é no
JavaScript da tela.

**Opção 1 — Firebase Console (mais simples):**
1. Acesse [console.firebase.google.com](https://console.firebase.google.com) → projeto `padrao-seguranca`.
2. Firestore Database → aba **Regras**.
3. Cole o conteúdo de `firestore.rules` e clique em **Publicar**.

**Opção 2 — Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # aponte para este projeto, aceite usar firestore.rules existente
firebase deploy --only firestore:rules
```

### Bootstrap do primeiro administrador

As regras exigem que **um admin já exista** para criar outros usuários — ou
seja, o primeiro `adm` do sistema precisa ser criado manualmente:

1. Crie o usuário em **Firebase Authentication** (e-mail/senha).
2. Copie o UID gerado.
3. No **Firestore Console**, crie manualmente o documento
   `users/{UID}` com os campos:
   ```json
   { "nome": "Seu Nome", "email": "voce@email.com", "role": "adm", "ativo": true }
   ```
4. A partir daí, use o painel ADM do sistema para cadastrar os demais
   funcionários normalmente.

## Perfis e permissões

| Papel | Pode ver | Pode fazer |
|---|---|---|
| `adm` | Tudo | Gerenciar condomínios, portarias e funcionários; ver todos os alertas |
| `porteiro` | Só os próprios alertas | Criar alerta; cancelar alerta próprio ainda "Aberto" |
| `vigilante` | Todos os alertas | Aceitar alerta "Aberto"; finalizar alerta que aceitou |

Essas regras agora são reforçadas tanto no app (`js/`) quanto no servidor
(`firestore.rules`) — antes só existiam no JavaScript da tela.

## Firestore

Coleções usadas: `users`, `condominios`, `portarias`, `alertas`.

## O que foi corrigido na v1.3

- **Firestore Security Rules criadas** (`firestore.rules`) — a autorização
  deixa de depender só do JavaScript do cliente.
- **Vazamento de dados entre condomínios corrigido**: porteiro agora só
  recebe (via query filtrada) os próprios alertas, em vez da coleção
  inteira; a lista de funcionários só é sincronizada para o ADM.
- **Vazamento de memória corrigido**: os listeners `onSnapshot` agora são
  cancelados no logout (antes se acumulavam a cada ciclo login/logout na
  mesma aba).
- **Erros de rede/permissão agora aparecem para o usuário**: todas as
  escritas no Firestore têm `try/catch` com aviso (`toast`); antes falhavam
  em silêncio.
- **Botões desabilitados durante o envio**, evitando alertas ou cadastros
  duplicados por duplo clique — especialmente importante no botão de
  emergência.
- **`confirm()`/`prompt()` nativos substituídos** por um modal próprio, mais
  confiável dentro de WebViews (WhatsApp, apps embutidos) e sem travar a
  interface.
- **Proteção contra sobrescrever funcionário por engano**: ao cadastrar um
  UID que já existe, o sistema avisa em vez de sobrescrever silenciosamente.
- **`index.html` reconectado aos módulos** `js/*.js` e `css/style.css` (a
  versão anterior tinha tudo duplicado inline e não carregava os arquivos
  modulares).

## Limitações conhecidas / próximos passos

Estes itens **não** foram implementados nesta rodada — são melhorias
maiores que exigem infraestrutura adicional (Cloud Functions, FCM, etc.)
e vale planejar à parte:

- **Notificação push (FCM)** para o vigilante quando um alerta "Crítico"
  é aberto — hoje depende da tela estar aberta.
- **Geolocalização em tempo real** do vigilante/portaria (hoje usa o
  endereço cadastrado, não o GPS do momento).
- **SLA/escalonamento** automático se um alerta "Aberto" não for aceito
  em X minutos.
- **Firebase Auth Custom Claims** para o papel (`role`), em vez de um
  campo no Firestore — mais rápido nas regras e não exige leitura extra.
- **Provisionamento automático de usuário** via Cloud Function no
  `onCreate` do Firebase Auth, eliminando o passo manual de copiar o UID.
- **Dashboard histórico** (tempo médio de resposta, alertas por
  condomínio/mês).
- **Persistência offline do Firestore**, importante justamente durante
  uma emergência com rede instável.
