# 📋 Lista Completa de Variáveis de Ambiente para Render

## ⚠️ COPIE E COLE ESTA LISTA NO RENDER

Vá em **Environment** no seu Web Service e adicione TODAS estas variáveis:

---

### 1. Banco de Dados (copie do seu PostgreSQL)

```
POSTGRES_SERVER
Valor: <copie o hostname interno do banco>
Exemplo: dpg-abc123-a.virginia-postgres.render.com
```

```
POSTGRES_USER
Valor: <copie do banco>
Exemplo: driver_finance_user
```

```
POSTGRES_PASSWORD
Valor: <copie do banco>
Exemplo: abc123def456...
```

```
POSTGRES_DB
Valor: <copie do banco>
Exemplo: driver_finance
```

```
POSTGRES_PORT
Valor: 5432
```

---

### 2. Segurança

```
ENVIRONMENT
Valor: production
```

```
SECRET_KEY
Valor: <gere com: openssl rand -hex 32>
Exemplo: 4f8e3a2b1c9d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1
```

```
ALGORITHM
Valor: HS256
```

```
ACCESS_TOKEN_EXPIRE_MINUTES
Valor: 30
```

---

### 3. Primeiro Super Usuário (Admin)

```
FIRST_SUPERUSER_EMAIL
Valor: <seu_email>
Exemplo: admin@meuapp.com
```

```
FIRST_SUPERUSER_PASSWORD
Valor: <senha_forte>
Exemplo: MinhaS3nh@Forte!123
```

**⚠️ IMPORTANTE:** Guarde essas credenciais! Você usará para fazer login como admin.

---

### 4. CORS (Opcional - pode ajustar depois)

```
FRONTEND_URL
Valor: http://localhost:8081
```

```
CORS_ORIGINS
Valor: http://localhost:8081,https://driver-finance-api.onrender.com
```

---

## ✅ Checklist

Após adicionar todas as variáveis:

- [ ] POSTGRES_SERVER ✅
- [ ] POSTGRES_USER ✅
- [ ] POSTGRES_PASSWORD ✅
- [ ] POSTGRES_DB ✅
- [ ] POSTGRES_PORT ✅
- [ ] ENVIRONMENT ✅
- [ ] SECRET_KEY ✅
- [ ] ALGORITHM ✅
- [ ] ACCESS_TOKEN_EXPIRE_MINUTES ✅
- [ ] FIRST_SUPERUSER_EMAIL ✅
- [ ] FIRST_SUPERUSER_PASSWORD ✅
- [ ] FRONTEND_URL (opcional)
- [ ] CORS_ORIGINS (opcional)

**Total obrigatório: 11 variáveis**

---

## 🚀 Após Adicionar

1. Clique em **"Save Changes"**
2. O Render fará **redeploy automático**
3. Aguarde ~2-5 minutos
4. Verifique os logs para: `✅ Database connection established`
5. Teste: `https://seu-service.onrender.com/health`

---

## 🔧 Como Obter os Valores do Banco

1. Vá no **PostgreSQL** que você criou
2. Clique nele
3. Aba **"Info"** ou **"Connect"**
4. Veja seção **"Internal Database URL"**

Formato da URL:
```
postgresql://USER:PASSWORD@SERVER:PORT/DATABASE
```

Exemplo real:
```
postgresql://driver_finance_user:abc123@dpg-xyz-a.virginia-postgres.render.com:5432/driver_finance
```

Extraia:
- **POSTGRES_USER:** `driver_finance_user`
- **POSTGRES_PASSWORD:** `abc123`
- **POSTGRES_SERVER:** `dpg-xyz-a.virginia-postgres.render.com`
- **POSTGRES_PORT:** `5432`
- **POSTGRES_DB:** `driver_finance`

---

## 🆘 Se Esquecer uma Variável

Você verá este erro nos logs:
```
ValidationError: X validation errors for Settings
VARIAVEL_FALTANDO
  Field required [type=missing]
```

**Solução:** Adicione a variável que está faltando e o Render fará redeploy.

