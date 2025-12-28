# 🚀 Quick Start - Testing

## 1. Instalar Dependências

```bash
cd backend
pip install -r requirements.txt
```

## 2. Rodar o Teste Placeholder

```bash
pytest tests/test_example.py -v
```

## 3. Adicionar Seus Testes

Substitua o conteúdo de `test_example.py` ou crie novos arquivos de teste em `tests/`:

### Teste Simples (sem banco de dados)

```python
# tests/test_seu_modulo.py
import pytest

def test_exemplo() -> None:
    """Teste simples sem dependências."""
    # Arrange
    expected = True

    # Act
    result = True

    # Assert
    assert result == expected
```

### Teste com API (requer cliente HTTP)

```python
# tests/test_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_endpoint(client: AsyncClient) -> None:
    """Teste de endpoint da API."""
    # Arrange
    data = {"test": "value"}

    # Act
    response = await client.get("/sua/rota")

    # Assert
    assert response.status_code == 200
```

## ✅ Pronto!

A estrutura básica está configurada. Adicione seus testes conforme necessário.
