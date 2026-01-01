# 🚀 Guia de Deploy no Render

## ⚠️ ORDEM CORRETA DE DEPLOY

**IMPORTANTE:** Siga esta ordem exata:

1. ✅ Criar o Banco de Dados PostgreSQL PRIMEIRO
2. ✅ Depois criar o Web Service (API)

## Passo 1: Criar Banco de Dados PostgreSQL

### 1.1 Criar o Banco

1. No dashboard do Render, clique em **"+ New"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `driver-finance-db`
   - **Database:** `driver_finance` (ou deixe o padrão)
   - **User:** Deixe o padrão (Render gera automaticamente)
   - **Region:** Virginia (US East) - mesma do Web Service
   - **PostgreSQL Version:** 15 ou 16
   - **Plan:** `Starter` ($7/mês) ou `Standard` ($20/mês)
3. Clique em **"Create Database"**
4. **Aguarde** o banco ficar disponível (~2-5 minutos)

### 1.2 Copiar Credenciais do Banco

Após o banco estar **Available**, copie estas informações (aba "Info" ou "Connect"):

- **Internal Database URL:** `postgresql://user:password@host:port/database`

OU as variáveis individuais:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST` (hostname interno)
- `POSTGRES_PORT` (geralmente 5432)
- `POSTGRES_DB`

⚠️ **Guarde essas credenciais** - você vai precisar delas no próximo passo!

---

## Passo 2: Criar Web Service (API Backend)

### 2.1 Usar o render.yaml (Recomendado)

1. No dashboard do Render, clique em **"+ New"** → **"Blueprint"**
2. Conecte seu repositório se ainda não conectou
3. Selecione o repositório: `CaueGrassi7/driver-finance-app`
4. O Render vai detectar o `render.yaml` automaticamente
5. Clique em **"Apply"**

### 2.2 Ou Configurar Manualmente

Se preferir configurar manualmente:

**Configurações Básicas:**

- **Name:** `driver-finance-api`
- **Runtime:** `Docker`
- **Branch:** `main`
- **Region:** `Virginia (US East)` (mesma do banco!)
- **Root Directory:** `backend` ⚠️ OBRIGATÓRIO
- **Dockerfile Path:** `./Dockerfile` (relativo ao Root Directory)
- **Docker Build Context Path:** `.`
- **Instance Type:** `Starter` ($7/mês) ou `Standard` ($25/mês)

### 2. Criar Banco de Dados PostgreSQL no Render

**ANTES de criar o Web Service**, crie o banco de dados:

1. No dashboard do Render, clique em **"+ New"** → **"PostgreSQL"**
2. Configure:

   - **Name:** `driver-finance-db`
   - **Database:** `driver_finance` (ou deixe o padrão)
   - **User:** Deixe o padrão (Render gera automaticamente)
   - **Region:** Mesma região do Web Service (Virginia)
   - **PostgreSQL Version:** 15
   - **Plan:** `Starter` ($7/mês) ou `Standard` ($20/mês)

3. **Anote as credenciais** que o Render fornecer:
   - `Internal Database URL` (formato: `postgresql://user:password@host:port/database`)
   - Ou as variáveis individuais:
     - `POSTGRES_USER`
     - `POSTGRES_PASSWORD`
     - `POSTGRES_HOST`
     - `POSTGRES_PORT`
     - `POSTGRES_DB`

### 2.3 Configurar Variáveis de Ambiente

⚠️ **CRÍTICO:** As variáveis de ambiente precisam ser configuradas ANTES do primeiro deploy!

Na seção **"Environment Variables"** do Web Service, adicione:

#### Variáveis do Banco de Dados (Use as credenciais do Passo 1)

```env
POSTGRES_USER=<copiar_do_banco>
POSTGRES_PASSWORD=<copiar_do_banco>
POSTGRES_SERVER=<copiar_hostname_interno_do_banco>
POSTGRES_PORT=5432
POSTGRES_DB=<copiar_do_banco>
```

**OU** use a URL completa (mais fácil):

```
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/database
```

#### Variáveis de Segurança (CRÍTICAS)

```
SECRET_KEY=<gere_uma_nova_com_openssl_rand_hex_32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

#### Variáveis do Superusuário

```
FIRST_SUPERUSER_EMAIL=admin@seudominio.com
FIRST_SUPERUSER_PASSWORD=<senha_forte_min_12_chars>
FIRST_SUPERUSER_FULL_NAME=Admin User
```

#### Variáveis de Ambiente

```
ENVIRONMENT=production
FRONTEND_URL=https://seu-app-mobile.com
```

### 4. Gerar SECRET_KEY Segura

No seu terminal local:

```bash
openssl rand -hex 32
```

Copie o resultado e use como valor de `SECRET_KEY` no Render.

### 5. Configurações Avançadas (opcional)

Na seção **"Advanced"** do Web Service:

- **Health Check Path:** `/health`
- **Auto-Deploy:** `Yes` (para deploy automático ao fazer push)
- **Pull Request Previews:** `Yes` (opcional, para testar PRs)

### 6. Deploy

1. Clique em **"Create Web Service"**
2. O Render vai:

   - Clonar seu repositório
   - Buildar a imagem Docker
   - Executar as migrações (via entrypoint.sh)
   - Iniciar o servidor

3. Aguarde o deploy completar (pode levar 5-10 minutos na primeira vez)

### 7. Verificar Deploy

Após o deploy:

1. **Verifique os logs:**

   - No dashboard do Render, vá em "Logs"
   - Procure por: `✅ Database connection established successfully`
   - Procure por: `Uvicorn running on`

2. **Teste o endpoint:**

   ```bash
   curl https://driver-finance-app.onrender.com/health
   # Deve retornar: {"status":"ok"}
   ```

3. **Teste a documentação:**
   ```
   https://driver-finance-app.onrender.com/docs
   ```

### 8. Configurar Mobile App para Produção

Após o deploy bem-sucedido:

1. **Atualize `mobile/app.json`:**

   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "https://driver-finance-app.onrender.com"
       }
     }
   }
   ```

2. **Atualize `FRONTEND_URL` no Render:**
   - Se você tem um domínio para o app mobile, use ele
   - Ou use `*` temporariamente (menos seguro, mas funciona)

### 9. Troubleshooting

#### Problema: Build falha

- Verifique se `Root Directory` está como `backend`
- Verifique se `Dockerfile Path` está como `backend/Dockerfile`
- Veja os logs de build no Render

#### Problema: `socket.gaierror: [Errno -2] Name or service not known`

⚠️ **Este é o erro mais comum!** Acontece quando:

- As variáveis de ambiente do banco NÃO foram configuradas
- O banco de dados não foi criado ANTES do Web Service
- O hostname do banco está incorreto

**Solução:**

1. **PARE** o deploy atual (se estiver rodando)
2. Vá em **Settings** → **Environment Variables**
3. Verifique se TODAS estas variáveis existem e estão corretas:
   - `POSTGRES_SERVER` (deve ser o hostname INTERNO do banco, ex: `dpg-xxxxx-a`)
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
   - `POSTGRES_PORT` (deve ser `5432`)
4. **Salve** as variáveis
5. Clique em **"Manual Deploy"** → **"Clear build cache & deploy"**

**Como obter o hostname correto:**

- Vá no seu banco PostgreSQL no Render
- Aba **"Info"** ou **"Connect"**
- Copie o **Internal Database URL** ou o **Hostname** interno
- Use o hostname que termina com `.render.com` DENTRO da rede do Render

#### Problema: Erro de conexão com banco

- Verifique se o banco está na mesma **região** (Virginia, Oregon, etc.)
- Verifique se está usando o **Internal Database URL** (não o External)
- Teste a conexão localmente com as mesmas credenciais

#### Problema: Migrações não rodam

- Verifique os logs do deploy
- O `entrypoint.sh` deve executar `alembic upgrade head` automaticamente
- Se as variáveis de ambiente estiverem corretas, as migrações rodam no startup

#### Problema: Rate limiting muito restritivo

- Ajuste em `backend/app/api/v1/endpoints/auth.py`
- Mude de `5/minute` para `10/minute` se necessário

### 10. Domínio Customizado (Opcional)

1. No Render, vá em **"Settings"** → **"Custom Domain"**
2. Adicione seu domínio (ex: `api.seudominio.com`)
3. Configure DNS conforme instruções do Render
4. Atualize `FRONTEND_URL` e `mobile/app.json` com o novo domínio

### 11. Monitoramento

- **Logs:** Disponível no dashboard do Render
- **Métricas:** Render fornece métricas básicas
- **Alertas:** Configure alertas para quando o serviço cair

### 12. Backup do Banco

1. No dashboard do PostgreSQL do Render
2. Configure backups automáticos (disponível em planos pagos)
3. Ou faça backups manuais via `pg_dump`

---

## ✅ Checklist Final

- [ ] Root Directory configurado como `backend`
- [ ] Dockerfile Path configurado como `backend/Dockerfile`
- [ ] Banco PostgreSQL criado no Render
- [ ] Todas as variáveis de ambiente configuradas
- [ ] SECRET_KEY gerada e configurada
- [ ] Deploy bem-sucedido
- [ ] Health check funcionando (`/health`)
- [ ] API docs acessível (`/docs`)
- [ ] Mobile app configurado com URL de produção
- [ ] Testado login/signup na API

---

## 📝 Notas Importantes

1. **Render Free Tier:**

   - Serviços "dormem" após 15 minutos de inatividade
   - Primeira requisição após dormir pode levar 30-60 segundos
   - Considere upgrade para produção real

2. **Custos Estimados:**

   - Web Service Starter: $7/mês
   - PostgreSQL Starter: $7/mês
   - **Total:** ~$14/mês

3. **Alternativas Gratuitas:**

   - Railway (tem tier gratuito limitado)
   - Fly.io (tem tier gratuito)
   - Render (free tier com limitações)

4. **Para Produção Real:**
   - Use planos pagos para evitar "sleep"
   - Configure domínio customizado
   - Configure SSL/HTTPS (Render faz automaticamente)
   - Configure backups automáticos do banco

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no Render dashboard
2. Teste localmente primeiro (`docker compose up`)
3. Verifique se todas as variáveis de ambiente estão corretas
4. Consulte a documentação do Render: https://render.com/docs
