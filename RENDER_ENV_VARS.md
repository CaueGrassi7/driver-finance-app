# 🔐 Variáveis de Ambiente para Render - Driver Finance App

## ✅ Banco de Dados Criado!

Use estas variáveis de ambiente no seu **Web Service** no Render:

### 📋 Variáveis do Banco de Dados

**Opção 1: Usar Internal Database URL (RECOMENDADO para serviços no Render)**

```
DATABASE_URL=postgresql+asyncpg://driver_finance_user:CqUZALXLv2GNnqpG40arLxgFoWYVhR8T@dpg-d5bcrfp5pdvs73bgi3bg-a/driver_finance
```

**Opção 2: Variáveis Individuais**

```
POSTGRES_USER=driver_finance_user
POSTGRES_PASSWORD=CqUZALXLv2GNnqpG40arLxgFoWYVhR8T
POSTGRES_SERVER=dpg-d5bcrfp5pdvs73bgi3bg-a
POSTGRES_PORT=5432
POSTGRES_DB=driver_finance
```

⚠️ **IMPORTANTE:**

- Use `postgresql+asyncpg://` (não apenas `postgresql://`) porque o código usa asyncpg
- Use a **Internal Database URL** se o Web Service estiver na mesma região (mais rápido e seguro)

---

### 🔑 Variáveis de Segurança (CRÍTICAS)

**Gere uma nova SECRET_KEY:**

```bash
openssl rand -hex 32
```

Depois adicione no Render:

```
SECRET_KEY=<cole_a_chave_gerada_aqui>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

### 👤 Variáveis do Superusuário

```
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=<senha_forte_min_12_caracteres>
FIRST_SUPERUSER_FULL_NAME=Admin User
```

**Exemplo de senha forte:**

```
FIRST_SUPERUSER_PASSWORD=Admin123456789!
```

---

### 🌍 Variáveis de Ambiente

```
ENVIRONMENT=production
FRONTEND_URL=*
```

**Nota sobre FRONTEND_URL:**

- Use `*` temporariamente para permitir todas as origens (desenvolvimento)
- Para produção, substitua por: `https://seu-app-mobile.com` ou `https://expo.dev`

---

## 📝 Checklist de Configuração

Quando criar o Web Service no Render:

1. ✅ **Root Directory:** `backend`
2. ✅ **Dockerfile Path:** `backend/Dockerfile`
3. ✅ **Environment Variables:** Adicione todas as variáveis acima

---

## 🚀 Ordem de Configuração

1. **Criar Web Service** com as configurações básicas
2. **Adicionar todas as variáveis de ambiente** acima
3. **Deploy automático** vai iniciar
4. **Aguardar** o build e deploy completarem
5. **Verificar logs** para confirmar que conectou ao banco

---

## ✅ Como Verificar se Funcionou

Após o deploy:

1. **Verifique os logs** no Render:

   - Procure por: `✅ Database connection established successfully`
   - Procure por: `Uvicorn running on`

2. **Teste o endpoint:**

   ```bash
   curl https://driver-finance-app.onrender.com/health
   # Deve retornar: {"status":"ok"}
   ```

3. **Acesse a documentação:**
   ```
   https://driver-finance-app.onrender.com/docs
   ```

---

## 🔒 Segurança

⚠️ **NUNCA compartilhe essas credenciais publicamente!**

- As credenciais do banco são sensíveis
- A SECRET_KEY é crítica para segurança JWT
- Mantenha essas informações privadas

---

## 📱 Próximo Passo: Configurar Mobile App

Após o deploy bem-sucedido, atualize:

**`mobile/app.json`:**

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://driver-finance-app.onrender.com"
    }
  }
}
```

Substitua `driver-finance-app` pelo nome real do seu serviço no Render.
