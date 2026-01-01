# 🔧 Como Corrigir o Erro de Deploy no Render

## ❌ Erro Atual

```
socket.gaierror: [Errno -2] Name or service not known
```

Este erro significa que o aplicativo **não consegue encontrar o banco de dados** durante o startup.

---

## ✅ Solução Rápida (3 passos)

### Passo 1: Criar o Banco de Dados PRIMEIRO

Se ainda não criou:

1. Vá em **Dashboard do Render** → **"+ New"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `driver-finance-db`
   - **Region:** `Virginia (US East)` (mesma do Web Service)
   - **Plan:** Starter
3. Clique em **"Create Database"**
4. **Aguarde** até aparecer status **"Available"** (~3-5 min)

### Passo 2: Copiar Credenciais do Banco

No banco de dados que você criou:

1. Clique no banco → Aba **"Info"** ou **"Connect"**
2. Copie estas informações:

```
Internal Database URL: postgresql://user:senha@hostname-interno:5432/database
```

OU copie individualmente:
- **Hostname** (interno): `dpg-xxxxx-a.virginia-postgres.render.com`
- **Username:** `driver_finance_xxxxx`
- **Password:** (senha gerada)
- **Database:** `driver_finance`
- **Port:** `5432`

⚠️ **IMPORTANTE:** Use o **INTERNAL** hostname, NÃO o external!

### Passo 3: Configurar Variáveis de Ambiente no Web Service

1. Vá no seu **Web Service** (API)
2. Clique em **"Environment"** (menu esquerdo)
3. Clique em **"Add Environment Variable"**
4. Adicione cada variável (UMA POR VEZ):

```env
# Banco de Dados (copie do seu PostgreSQL no Render)
POSTGRES_SERVER=dpg-xxxxx-a.virginia-postgres.render.com
POSTGRES_USER=driver_finance_xxxxx
POSTGRES_PASSWORD=<sua_senha_copiada>
POSTGRES_DB=driver_finance
POSTGRES_PORT=5432

# Segurança
ENVIRONMENT=production
SECRET_KEY=<gere_uma_string_aleatoria_de_32_chars>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Primeiro Super Usuário (admin)
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=senhaSegura123!

# CORS (opcional, ajuste depois)
FRONTEND_URL=http://localhost:8081
CORS_ORIGINS=http://localhost:8081,https://driver-finance-api.onrender.com
```

**Para gerar o SECRET_KEY:**
```bash
openssl rand -hex 32
```

**Sobre o FIRST_SUPERUSER:**
- É o primeiro usuário admin criado automaticamente
- Use um email e senha que você lembrará
- Você pode fazer login com essas credenciais depois

5. Clique em **"Save Changes"**
6. O Render vai fazer um **redeploy automático**

---

## ✅ Verificar se Funcionou

Após o deploy terminar:

1. Vá em **"Logs"** no Web Service
2. Procure por:
   ```
   ✅ Database connection established successfully
   INFO:     Application startup complete
   ```

3. Teste o endpoint:
   ```
   https://driver-finance-api.onrender.com/health
   ```
   Deve retornar: `{"status":"ok"}`

4. Teste a documentação:
   ```
   https://driver-finance-api.onrender.com/docs
   ```

---

## 🚨 Se Ainda Não Funcionar

### Erro Persiste Após Configurar Variáveis?

1. **Force um rebuild limpo:**
   - Vá em **"Manual Deploy"**
   - Selecione **"Clear build cache & deploy"**

2. **Verifique os logs:**
   - Procure por `🔌 Attempting to connect to`
   - Veja qual hostname está sendo usado
   - Se aparecer `db` ou `postgres` → variáveis estão erradas!
   - Deve aparecer `dpg-xxxxx.render.com`

3. **Verifique a região:**
   - Banco e Web Service devem estar na **MESMA REGIÃO**
   - Ex: ambos em `Virginia (US East)`

### Erro: "Root Directory" não configurado?

No Web Service:
1. Vá em **"Settings"**
2. Procure por **"Root Directory"**
3. Defina como: `backend`
4. **Dockerfile Path:** `./Dockerfile`
5. Salve e faça redeploy

---

## 📝 Configuração Correta do Web Service

Verifique se está assim:

**Settings → Build & Deploy:**
- **Runtime:** Docker
- **Root Directory:** `backend`
- **Dockerfile Path:** `./Dockerfile`
- **Docker Build Context Path:** `.`
- **Docker Command:** (vazio - usa o CMD do Dockerfile)

**Environment:**
- Todas as variáveis listadas acima ✅

**Deploy:**
- **Auto-Deploy:** Yes (para deploy automático no push)
- **Branch:** main

---

## 🎯 Ordem Correta de Deploy

**SEMPRE nesta ordem:**

1. ✅ **Criar PostgreSQL Database**
2. ✅ **Copiar credenciais**
3. ✅ **Criar Web Service com variáveis configuradas**
4. ✅ **Aguardar deploy completar**
5. ✅ **Testar endpoints**

---

## 📚 Documentação Completa

Para mais detalhes, veja: [RENDER_DEPLOY.md](./RENDER_DEPLOY.md)

---

## 💡 Dica Pro

Use o `render.yaml` na raiz do projeto para deploy automático:

```bash
git add render.yaml
git commit -m "feat: add render.yaml for automatic deployment"
git push origin main
```

Depois no Render:
1. **"+ New"** → **"Blueprint"**
2. Selecione o repositório
3. O Render detecta o `render.yaml` automaticamente
4. Apenas adicione as **senhas** manualmente (por segurança)

