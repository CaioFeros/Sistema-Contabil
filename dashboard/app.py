import streamlit as st
import pandas as pd
import plotly.express as px
from sqlalchemy import create_engine, text
import os

st.set_page_config(
    page_title="Dashboard Contábil",
    page_icon="📊",
    layout="wide"
)

# --- CONEXÃO COM O BANCO DE DADOS ---
@st.cache_data(ttl=600) # Cache dos dados por 10 minutos
def load_data():
    """
    Carrega os dados de processamento e clientes do banco de dados,
    unindo as tabelas para obter um DataFrame completo.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        st.error("A variável de ambiente DATABASE_URL não está configurada.")
        return pd.DataFrame()

    try:
        engine = create_engine(db_url)
        query = text("""
            SELECT
                p.ano,
                p.mes,
                p.faturamento_total,
                p.imposto_calculado,
                c.razao_social,
                c.id as cliente_id
            FROM processamento p
            JOIN cliente c ON p.cliente_id = c.id
            ORDER BY p.ano, p.mes;
        """)
        with engine.connect() as connection:
            df = pd.read_sql(query, connection)
        # Garante que os tipos de dados estão corretos
        df['faturamento_total'] = pd.to_numeric(df['faturamento_total'])
        df['imposto_calculado'] = pd.to_numeric(df['imposto_calculado'])
        return df
    except Exception as e:
        st.error(f"Erro ao conectar ou buscar dados do banco: {e}")
        return pd.DataFrame()

df = load_data()

# --- INTERFACE DO USUÁRIO (SIDEBAR) ---
st.title("📊 Dashboard Contábil Interativo")

st.sidebar.header("Filtros")

if df.empty:
    st.warning("Nenhum dado para exibir. Verifique a conexão com o banco ou se há dados populados.")
else:
    # Filtro de Cliente
    clientes_disponiveis = sorted(df['razao_social'].unique())
    clientes_selecionados = st.sidebar.multiselect(
        "Selecione a(s) Empresa(s):",
        options=clientes_disponiveis,
        default=clientes_disponiveis
    )

    # Filtro de Ano
    anos_disponiveis = sorted(df['ano'].unique(), reverse=True)
    anos_selecionados = st.sidebar.multiselect(
        "Selecione o(s) Ano(s):",
        options=anos_disponiveis,
        default=anos_disponiveis
    )

    # Aplica os filtros no DataFrame
    df_filtrado = df[df['razao_social'].isin(clientes_selecionados) & df['ano'].isin(anos_selecionados)]

    # --- EXIBIÇÃO DOS DADOS (PAINEL PRINCIPAL) ---

    # KPIs (Indicadores Chave)
    faturamento_total = df_filtrado['faturamento_total'].sum()
    imposto_total = df_filtrado['imposto_calculado'].sum()
    aliquota_media = (imposto_total / faturamento_total) * 100 if faturamento_total > 0 else 0

    col1, col2, col3 = st.columns(3)
    col1.metric("Faturamento Total", f"R$ {faturamento_total:,.2f}")
    col2.metric("Imposto Total", f"R$ {imposto_total:,.2f}")
    col3.metric("Alíquota Média", f"{aliquota_media:.2f}%")

    st.markdown("---")

    # --- GRÁFICOS ---
    # Verifica se há dados para exibir antes de tentar criar os gráficos
    if df_filtrado.empty:
        st.info("Nenhum dado encontrado para os filtros selecionados.")
    else:
        # Gráfico de Faturamento Mensal
        faturamento_mensal = (
            df_filtrado.groupby(['ano', 'mes'])['faturamento_total']
            .sum().reset_index()
            .sort_values(by=['ano', 'mes'])
        )
        # Cria a coluna 'periodo' de forma vetorizada e segura quanto aos tipos
        faturamento_mensal['periodo'] = faturamento_mensal['mes'].astype(int).astype(str).str.zfill(2) + '/' + faturamento_mensal['ano'].astype(int).astype(str)

        fig_faturamento = px.bar(faturamento_mensal, x='periodo', y='faturamento_total', title="Faturamento Mensal", labels={'faturamento_total': 'Faturamento (R$)', 'periodo': 'Mês/Ano'}, text_auto='.2s')
        st.plotly_chart(fig_faturamento, use_container_width=True)