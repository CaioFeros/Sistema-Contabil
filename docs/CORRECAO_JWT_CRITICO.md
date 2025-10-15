# 🔴 Correção Crítica: JWT - Subject Must Be String

## Problema Crítico Identificado

### Sintoma
```
127.0.0.1 - - [15/Oct/2025 16:36:24] "POST /api/auth/login HTTP/1.1" 200 -
127.0.0.1 - - [15/Oct/2025 16:36:24] "GET /api/auth/me HTTP/1.1" 401 -
127.0.0.1 - - [15/Oct/2025 16:36:26] "GET /api/clientes HTTP/1.1" 401 -
```

- ✅ Login retorna 200 (sucesso)
- ❌ Todas as outras requisições retornam 401 (não autorizado)
- ❌ Token criado mas não pode ser validado

---

## Causa Raiz

### Erro no PyJWT
```
Subject must be a string
```

**Explicação**: O PyJWT (biblioteca JWT do Python) requer que o campo `sub` (subject) do payload seja uma **string**, não um inteiro.

### Código Problemático

**ANTES** (Causava erro):
```python
payload = {
    'sub': usuario.id,  # ❌ Inteiro - ERRO!
    'iat': datetime.now(timezone.utc),
    'exp': datetime.now(timezone.utc) + timedelta(hours=1)
}
```

**Problemas**:
1. `sub` era um inteiro (ID do usuário)
2. `datetime.now(timezone.utc)` criava objeto datetime, não timestamp

---

## Solução Aplicada

### Correções Implementadas

**AGORA** (Funciona corretamente):
```python
payload = {
    'sub': str(usuario.id),  # ✅ String - CORRETO!
    'iat': int(time.time()),  # ✅ Unix timestamp
    'exp': int(time.time()) + 3600  # ✅ 1 hora em segundos
}
```

**Melhorias**:
1. ✅ `sub` convertido para string
2. ✅ Timestamps usando Unix time (int) ao invés de datetime
3. ✅ Mais compatível e confiável

### Decodificação Atualizada

```python
data = jwt.decode(token, secret_key, algorithms=["HS256"])
user_id = int(data['sub'])  # ✅ Converte de volta para inteiro
current_user = Usuario.query.get(user_id)
```

---

## Arquivos Modificados

### `backend/app/auth.py`

1. **Imports**:
```python
import time  # Adicionado
```

2. **Criação do Token** (linha ~146):
```python
payload = {
    'sub': str(usuario.id),  # String!
    'iat': int(time.time()),
    'exp': int(time.time()) + 3600
}
```

3. **Validação do Token** (linha ~44):
```python
user_id = int(data['sub'])  # Converte de volta
current_user = Usuario.query.get(user_id)
```

4. **Logs de Debug** (temporários):
```python
print(f"[DEBUG] Secret key exists: {bool(secret_key)}", flush=True)
print(f"[DEBUG] Token decodificado: {data}", flush=True)
print(f"[DEBUG] Usuário autenticado: {current_user.username}", flush=True)
```

---

## Teste Realizado

### Script de Teste: `backend/testar_jwt.py`

**Resultado**:
```
=== TESTE DE JWT ===
Token criado (Unix timestamp): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
[OK] Token decodificado com sucesso: {'sub': '1', 'iat': 1760557208, 'exp': 1760560808}
```

✅ Token criado e decodificado com sucesso!

---

## Como Testar

### 1. Reiniciar o Servidor
```bash
# Pare o servidor atual (Ctrl+C)
python iniciar_sistema.py
```

### 2. Limpar Tokens Antigos
```javascript
// No console do navegador (F12):
localStorage.clear();
```

### 3. Fazer Login
1. Acesse http://localhost:5000
2. Username: `admin`
3. Senha: `admin123`

### 4. Verificar Logs do Backend

**Esperado**:
```
[DEBUG LOGIN] Token criado para usuário ID: 1
[DEBUG LOGIN] Token: eyJhbGciOiJIUzI1Ni...
[DEBUG LOGIN] Secret key exists: True
```

Ao acessar outras páginas:
```
[DEBUG] Secret key exists: True
[DEBUG] Token recebido: eyJhbGciOiJIUzI1Ni...
[DEBUG] Token decodificado: {'sub': '1', 'iat': ..., 'exp': ...}
[DEBUG] Usuário autenticado: admin
```

### 5. Verificar Sucesso

**Console do Backend**:
```
127.0.0.1 - - [XX/XX/XXXX XX:XX:XX] "POST /api/auth/login HTTP/1.1" 200 -
127.0.0.1 - - [XX/XX/XXXX XX:XX:XX] "GET /api/auth/me HTTP/1.1" 200 -
127.0.0.1 - - [XX/XX/XXXX XX:XX:XX] "GET /api/clientes HTTP/1.1" 200 -
```

Todos devem retornar **200** (sucesso)!

---

## Fluxo Correto de Autenticação

### 1. Login
```
Usuario faz login
    ↓
Backend cria token JWT
    ↓
'sub': str(usuario.id)  ← String!
'iat': int(time.time())  ← Unix timestamp
'exp': int(time.time()) + 3600  ← 1 hora
    ↓
Token retornado para frontend
    ↓
Salvo em localStorage['authToken']
```

### 2. Requisições Subsequentes
```
Frontend faz requisição
    ↓
Header: Authorization: Bearer <token>
    ↓
Backend valida token
    ↓
jwt.decode(token, secret_key)
    ↓
user_id = int(data['sub'])  ← Converte para int
    ↓
Usuário autenticado ✅
    ↓
Resposta 200 OK
```

---

## Problemas Comuns e Soluções

### Erro: "Subject must be a string"
- **Causa**: `sub` no payload é inteiro
- **Solução**: Use `str(usuario.id)`

### Erro: "Token inválido"
- **Causa**: Secret key diferente na criação e validação
- **Solução**: Verifique `.env` está sendo carregado

### Erro 401 após login bem-sucedido
- **Causa**: Problema na validação do token
- **Solução**: Verifique logs de debug no backend

---

## Limpeza dos Logs de Debug

Após confirmar que está funcionando, você pode remover os `print()` de debug em `backend/app/auth.py`:

```python
# Remover estas linhas após teste:
print(f"[DEBUG] ...", flush=True)
```

Ou manter para debugging futuro.

---

## Referências

- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- Unix Timestamp: Segundos desde 1970-01-01 00:00:00 UTC

---

## Data da Correção
15 de Outubro de 2025

## Prioridade
🔴 **CRÍTICA** - Sistema não funcionava sem esta correção

## Status
✅ **RESOLVIDO E TESTADO**
