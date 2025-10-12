"""
Testes para o parser de CSV de Notas Fiscais
"""
import pytest
from decimal import Decimal
from app.csv_parser import NFECSVParser


def test_limpar_cnpj():
    """Testa limpeza de CNPJ"""
    parser = NFECSVParser()
    
    assert parser.limpar_cnpj("31.710.936/0001-30") == "31710936000130"
    assert parser.limpar_cnpj("31710936000130") == "31710936000130"
    assert parser.limpar_cnpj("") == ""


def test_limpar_valor():
    """Testa conversão de valores"""
    parser = NFECSVParser()
    
    assert parser.limpar_valor("1.790,00") == Decimal("1790.00")
    assert parser.limpar_valor("5.710,92") == Decimal("5710.92")
    assert parser.limpar_valor("70") == Decimal("70")
    assert parser.limpar_valor("10.059,97") == Decimal("10059.97")
    assert parser.limpar_valor("") == Decimal("0")


def test_parse_data():
    """Testa parsing de datas"""
    parser = NFECSVParser()
    
    data1 = parser.parse_data("26/09/2025 15:52")
    assert data1 is not None
    assert data1.day == 26
    assert data1.month == 9
    assert data1.year == 2025
    assert data1.hour == 15
    assert data1.minute == 52
    
    data2 = parser.parse_data("08/09/2025 15:06")
    assert data2 is not None
    assert data2.day == 8
    assert data2.month == 9
    
    data3 = parser.parse_data("05/09/2025")
    assert data3 is not None
    assert data3.day == 5


def test_csv_real_structure():
    """
    Testa o CSV real fornecido pelo usuário
    Nota: Este é um teste de estrutura, não de processamento completo
    """
    # Simula o cabeçalho do CSV real
    cabecalho_esperado = [
        'Tipo de Registro',
        'Nº da Nota Fiscal Eletrônica',
        'Status da Nota Fiscal',
        'Código de Verificação NF',
        'Data Hora da Emissão da Nota Fiscal',
        'CPF/CNPJ do Prestador',
        'Razão Social do Prestador',
        'Valor dos Serviços',
        'Data de Competência',
        'Discriminação dos Serviços'
    ]
    
    parser = NFECSVParser()
    
    # Verifica se as colunas relevantes estão no mapeamento
    assert 'numero_nf' in parser.COLUNAS_RELEVANTES
    assert 'cnpj_prestador' in parser.COLUNAS_RELEVANTES
    assert 'valor_servicos' in parser.COLUNAS_RELEVANTES
    assert 'data_competencia' in parser.COLUNAS_RELEVANTES
    
    # Verifica valores do CSV real
    assert parser.COLUNAS_RELEVANTES['numero_nf'] == 'Nº da Nota Fiscal Eletrônica'
    assert parser.COLUNAS_RELEVANTES['cnpj_prestador'] == 'CPF/CNPJ do Prestador'


def test_valores_do_csv_real():
    """Testa os valores exatos do CSV fornecido"""
    parser = NFECSVParser()
    
    # Valores do CSV real
    valores_csv = [
        "1.790,00",
        "5.710,92",
        "70",
        "25",
        "10.059,97",
        "205,84",
        "2.220,04"
    ]
    
    valores_esperados = [
        Decimal("1790.00"),
        Decimal("5710.92"),
        Decimal("70"),
        Decimal("25"),
        Decimal("10059.97"),
        Decimal("205.84"),
        Decimal("2220.04")
    ]
    
    for csv_val, esperado in zip(valores_csv, valores_esperados):
        resultado = parser.limpar_valor(csv_val)
        assert resultado == esperado, f"Esperado {esperado}, obteve {resultado} para {csv_val}"
    
    # Testa soma total
    total = sum(parser.limpar_valor(v) for v in valores_csv)
    assert total == Decimal("20081.77"), f"Total esperado 20081.77, obteve {total}"


def test_cnpj_do_csv_real():
    """Testa o CNPJ do CSV real"""
    parser = NFECSVParser()
    
    cnpj_formatado = "31.710.936/0001-30"
    cnpj_limpo = parser.limpar_cnpj(cnpj_formatado)
    
    assert cnpj_limpo == "31710936000130"
    assert len(cnpj_limpo) == 14


def test_datas_do_csv_real():
    """Testa as datas do CSV real"""
    parser = NFECSVParser()
    
    datas_csv = [
        "26/09/2025 15:52",
        "08/09/2025 15:06",
        "05/09/2025 09:23",
        "04/09/2025 14:40",
        "03/09/2025 11:51",
        "03/09/2025 11:50",
        "03/09/2025 11:45"
    ]
    
    for data_str in datas_csv:
        data = parser.parse_data(data_str)
        assert data is not None, f"Falha ao parsear {data_str}"
        assert data.month == 9
        assert data.year == 2025


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

