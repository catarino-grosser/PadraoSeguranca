# Padrão Segurança - Central Operacional v1.3

Projeto web para Netlify + GitHub + Firebase Authentication + Firestore.

## Estrutura

```txt
padrao-seguranca/
├── index.html
├── firestore.rules
├── netlify.toml
├── package.json
├── firebase-messaging-sw.js
├── css/
│   └── style.css
├── js/
│   ├── admin.js
│   ├── alertas.js
│   ├── app.js
│   ├── auth.js
│   ├── firebase.js
│   ├── netlifyFunctions.js
│   ├── push.js
│   ├── state.js
│   └── utils.js
└── netlify/
    └── functions/
        ├── criar-funcionario.js
        ├── notificar-alerta.js
        ├── checar-sla.js
        └── _shared/
            └── firebaseAdmin.js
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

## Netlify Functions (v1.4) — backend sem Cloud Functions do Firebase

Esta versão adiciona 3 Netlify Functions em `netlify/functions/`, usando o
Firebase Admin SDK para fazer o que só um servidor confiável pode fazer:

| Function | O que faz | Como é chamada |
|---|---|---|
| `criar-funcionario` | Cria a conta no Firebase Auth + perfil no Firestore + Custom Claim do papel, tudo numa chamada | Painel ADM → "Salvar funcionário" (novo) |
| `notificar-alerta` | Envia push (FCM) pra todos os vigilantes ativos | Automático, logo após um porteiro criar um alerta |
| `checar-sla` | Escala alertas "Aberto" parados há muito tempo | Sozinha, a cada 5 min (function agendada) |

### 1. Gerar a service account do Firebase

1. Abra [console.firebase.google.com](https://console.firebase.google.com) no navegador do celular → selecione o projeto **padrao-seguranca**.
2. Toque na ⚙️ ao lado de "Visão geral do projeto" (canto superior esquerdo) → **Configurações do projeto**.
3. Vá na aba **Contas de serviço**.
4. Toque em **Gerar nova chave privada** → confirme. Um arquivo `.json` é baixado (geralmente vai pra pasta "Download" do celular).

### 2. Configurar a variável de ambiente no Netlify

Só precisa de **1 variável** — o arquivo inteiro que você acabou de baixar, sem editar nada nele:

1. Abra o arquivo `.json` baixado (pode abrir com o próprio Spck Editor, ou o gerenciador de arquivos do celular → "Abrir com").
2. Selecione **todo o conteúdo** do arquivo (geralmente dá pra tocar e segurar → "Selecionar tudo") e copie.
3. No painel do Netlify: **Site configuration** → **Environment variables** → **Add a variable**.
4. **Key** (nome): `FIREBASE_SERVICE_ACCOUNT_JSON`
5. **Value** (valor): cole o conteúdo inteiro do arquivo `.json` que você copiou — desde o `{` até o `}` final, sem tirar nem adicionar nada.
6. Salve.

Isso evita o erro mais comum (copiar só um pedaço da chave privada, que é bem
longa) — copiando o arquivo inteiro de uma vez, não tem como errar.

Variável opcional:

| Nome | Valor |
|---|---|
| `SLA_MINUTOS` | minutos até escalar um alerta parado (padrão: 10, se não configurar) |

**Nunca** coloque o conteúdo desse `.json` num arquivo do projeto/GitHub — é
a chave mestra da sua conta Firebase. Ele deve existir *só* dentro da
variável de ambiente do Netlify. Depois de configurar, pode apagar o
arquivo `.json` baixado no celular.

### 3. Ativar o Firebase Cloud Messaging (push notification)

1. No mesmo **Configurações do projeto**, vá na aba **Cloud Messaging**.
2. Role até **Certificados push da Web**.
3. Se não tiver nenhuma chave ainda, toque em **Gerar par de chaves**.
4. Aparece uma chave (uma linha só de texto, começando com algo como `B...`) — toque no ícone de copiar ao lado dela.
5. Abra `js/push.js` no Spck Editor, procure por `COLE_AQUI_SUA_VAPID_KEY_DO_FIREBASE` e substitua só essa parte (mantendo as aspas) pela chave copiada. Salve e dê commit/push.

Essa chave é pública — pode ficar no código do site sem problema (diferente
do JSON da service account, que é secreto).

### 4. Plano do Firebase

Netlify Functions não dependem do plano do Firebase, mas o **envio de push
pelo Admin SDK e a leitura do Firestore pelo servidor não têm custo extra**
no plano gratuito (Spark) — você só paga se ultrapassar as cotas normais
do Firestore/Auth, que já usa hoje. Não é necessário migrar pro plano Blaze
nessa arquitetura (isso só seria obrigatório se fosse usar Cloud Functions
do próprio Firebase, que não é o caso aqui).

### 5. Testando

- **`criar-funcionario`** e **`notificar-alerta`** só existem depois de um
  **deploy real no Netlify** — não funcionam abrindo o `index.html` local
  ou na pré-visualização do Spck Editor. Teste sempre no site publicado.
- **`checar-sla`** pode ser testada manualmente: no painel do Netlify vá em
  **Functions**, clique em `checar-sla` → **Run now** (não precisa esperar
  os 5 minutos).
- Se `criar-funcionario` der erro, confira os **logs da function** no
  painel do Netlify (Functions → checar-sla/criar-funcionario → Real-time
  logs) — geralmente aponta direto se é problema de variável de ambiente.

### Limitações desta implementação

- Editar o **papel (role)** de um funcionário já existente pelo formulário
  simples atualiza o Firestore, mas **não atualiza o Custom Claim**. Isso
  não é um risco de segurança (as regras do Firestore continuam usando o
  documento, não o claim), mas se algo no futuro passar a confiar no claim,
  lembre de criar também uma function `atualizar-papel`.
- O provisionamento automático (trigger nativo do Firebase Auth) não é
  possível via Netlify — por isso a criação passou a ser 100% pela function
  `criar-funcionario`, que já resolve o mesmo problema de forma mais direta.


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

Itens do roadmap anterior já implementados na v1.4: notificação push (FCM),
Custom Claims via `criar-funcionario`, e provisionamento automático de
usuário (sem copiar UID manualmente).

O que ainda não foi feito:

- **Geolocalização em tempo real** do vigilante/portaria (hoje usa o
  endereço cadastrado, não o GPS do momento).
- **Dashboard histórico** (tempo médio de resposta, alertas por
  condomínio/mês).
- **Tela de troca de senha** para o próprio funcionário (hoje só o ADM
  define a senha inicial, na criação).
- **Persistência offline do Firestore**, importante justamente durante
  uma emergência com rede instável.
