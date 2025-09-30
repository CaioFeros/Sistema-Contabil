import pytest
from app.services import calcular_impostos

# Usamos pytest.mark.parametrize para testar múltiplos cenários com a mesma função de teste.
# Isso torna o teste mais limpo e fácil de estender.
@pytest.mark.parametrize(
    "faturamento, regime, imposto_esperado",
    [
        # Cenário 1: Simples Nacional
        (1000.00, "Simples Nacional", 60.00),
        
        # Cenário 2: Lucro Presumido
        (1000.00, "Lucro Presumido", 113.30),

        # Cenário 3: Lucro Real
        (1000.00, "Lucro Real", 150.00),

        # Cenário 4: Faturamento zero
        (0.00, "Simples Nacional", 0.00),

        # Cenário 5: Regime tributário não conhecido (deve retornar 0)
        (1000.00, "MEI", 0.00),

        # Cenário 6: Faturamento com centavos
        (1550.75, "Simples Nacional", 93.045)
    ]
)
def test_calcular_impostos(faturamento, regime, imposto_esperado):
    """
    Testa a função de cálculo de impostos para diferentes regimes e valores.
    """
    # Chama a função que está sendo testada
    imposto_calculado = calcular_impostos(faturamento, regime)

    # Compara o resultado com o valor esperado, usando pytest.approx para lidar com floats
    assert imposto_calculado == pytest.approx(imposto_esperado)