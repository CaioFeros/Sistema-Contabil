"""
Parser de CSV de Notas Fiscais Eletrônicas
Processa arquivos CSV no formato da Prefeitura/SEFAZ
"""
import pandas as pd
import io
from datetime import datetime
from decimal import Decimal
import re
from typing import Dict, List, Tuple, Optional


class NFECSVParser:
    """Parser específico para CSV de Notas Fiscais Eletrônicas"""
    
    # Mapeamento das colunas relevantes do CSV
    # Usamos múltiplas variações possíveis de nomes
    COLUNAS_RELEVANTES = {
        'numero_nf': [
            'Nº da Nota Fiscal Eletrônica',
            'Número da Nota Fiscal',
            'Numero NF',
            'NF'
        ],
        'data_competencia': [
            'Data de Competência',
            'Data Competência',
            'Competência',
            'Data Hora da Emissão da Nota Fiscal',
            'Data Emissão'
        ],
        'cnpj_prestador': [
            'CPF/CNPJ do Prestador',
            'CNPJ Prestador',
            'CNPJ'
        ],
        'razao_social_prestador': [
            'Razão Social do Prestador',
            'Razao Social Prestador',
            'Nome Prestador'
        ],
        'razao_social_tomador': [
            'Razão Social do Tomador',
            'Razao Social Tomador',
            'Nome Tomador'
        ],
        'valor_servicos': [
            'Valor dos Serviços',
            'Valor Servicos',
            'Valor'
        ],
        'data_cancelamento': [
            'Data de Cancelamento',
            'Data Cancelamento',
            'Cancelamento'
        ]
    }
    
    @staticmethod
    def encontrar_coluna(df_columns: list, possiveis_nomes: list) -> Optional[str]:
        """
        Encontra a coluna no dataframe a partir de uma lista de nomes possíveis
        """
        for nome_possivel in possiveis_nomes:
            if nome_possivel in df_columns:
                return nome_possivel
        return None
    
    @staticmethod
    def limpar_cnpj(cnpj: str) -> str:
        """Remove formatação do CNPJ"""
        if pd.isna(cnpj) or cnpj == '':
            return ''
        return re.sub(r'[^\d]', '', str(cnpj))
    
    @staticmethod
    def limpar_valor(valor: str) -> Decimal:
        """Converte valor de string para Decimal"""
        if pd.isna(valor) or valor == '':
            return Decimal('0')
        
        # Remove espaços e converte vírgula em ponto
        valor_limpo = str(valor).strip().replace('.', '').replace(',', '.')
        
        try:
            return Decimal(valor_limpo)
        except:
            return Decimal('0')
    
    @staticmethod
    def parse_data(data_str: str) -> Optional[datetime]:
        """Converte string de data para datetime"""
        if pd.isna(data_str) or data_str == '':
            return None
        
        # Tenta vários formatos comuns
        formatos = [
            '%d/%m/%Y %H:%M',
            '%d/%m/%Y',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d'
        ]
        
        for formato in formatos:
            try:
                return datetime.strptime(str(data_str).strip(), formato)
            except:
                continue
        
        return None
    
    @classmethod
    def validar_estrutura_csv(cls, df: pd.DataFrame) -> Tuple[bool, str, dict]:
        """
        Valida se o CSV tem a estrutura esperada
        
        Returns:
            Tuple[bool, str, dict]: (válido, mensagem_erro, mapeamento_colunas)
        """
        # Mapeamento que será retornado
        mapeamento = {}
        
        # Colunas essenciais que precisam estar presentes
        colunas_essenciais = ['cnpj_prestador', 'valor_servicos', 'data_competencia']
        colunas_faltantes = []
        
        # Tenta encontrar cada coluna essencial
        for chave in colunas_essenciais:
            coluna_encontrada = cls.encontrar_coluna(df.columns.tolist(), cls.COLUNAS_RELEVANTES[chave])
            if coluna_encontrada:
                mapeamento[chave] = coluna_encontrada
            else:
                colunas_faltantes.append(chave)
        
        if colunas_faltantes:
            # Monta mensagem de erro detalhada e acionável
            campos_faltando = []
            for chave in colunas_faltantes:
                nomes_possiveis = cls.COLUNAS_RELEVANTES[chave]
                campos_faltando.append(f"• {nomes_possiveis[0]}")
            
            erro = "❌ Colunas obrigatórias não encontradas no CSV:\n"
            erro += "\n".join(campos_faltando)
            erro += "\n\n📋 Colunas encontradas no arquivo:\n"
            erro += ", ".join(df.columns.tolist()[:15])
            if len(df.columns) > 15:
                erro += f"... (+ {len(df.columns) - 15} colunas)"
            erro += "\n\n💡 Solução: Certifique-se de exportar o CSV completo da Prefeitura/SEFAZ com todas as colunas."
            
            return False, erro, {}
        
        # Tenta encontrar as colunas opcionais
        for chave in ['numero_nf', 'razao_social_prestador', 'razao_social_tomador', 'data_cancelamento']:
            coluna_encontrada = cls.encontrar_coluna(df.columns.tolist(), cls.COLUNAS_RELEVANTES[chave])
            if coluna_encontrada:
                mapeamento[chave] = coluna_encontrada
        
        # Remove linhas de totalizador
        df_limpo = cls._remover_linhas_totalizadoras(df)
        
        if len(df_limpo) == 0:
            erro = "❌ CSV não contém dados válidos.\n"
            erro += "O arquivo parece conter apenas linhas de total/subtotal ou está vazio.\n\n"
            erro += "💡 Solução: Certifique-se de que o CSV exportado da Prefeitura contém as notas fiscais."
            return False, erro, {}
        
        return True, "", mapeamento
    
    @staticmethod
    def _remover_linhas_totalizadoras(df: pd.DataFrame) -> pd.DataFrame:
        """Remove linhas de total/subtotal do dataframe"""
        # Remove linhas onde a primeira coluna é 'Total' ou contém 'Total'
        if len(df) > 0:
            primeira_coluna = df.columns[0]
            df = df[~df[primeira_coluna].astype(str).str.contains('Total', case=False, na=False)]
        
        return df
    
    @classmethod
    def validar_cnpj_unico(cls, df: pd.DataFrame, mapeamento: dict) -> Tuple[bool, str, Optional[str]]:
        """
        Valida se o CSV contém apenas um CNPJ de prestador
        
        Args:
            df: DataFrame com os dados
            mapeamento: Dict com mapeamento de colunas
        
        Returns:
            Tuple[bool, str, Optional[str]]: (válido, mensagem_erro, cnpj)
        """
        df = cls._remover_linhas_totalizadoras(df)
        
        col_cnpj = mapeamento.get('cnpj_prestador')
        
        if not col_cnpj or col_cnpj not in df.columns:
            return False, "Coluna de CNPJ não encontrada", None
        
        # Limpa CNPJs
        cnpjs = df[col_cnpj].dropna().apply(cls.limpar_cnpj)
        cnpjs_unicos = cnpjs[cnpjs != ''].unique()
        
        if len(cnpjs_unicos) == 0:
            return False, "❌ Nenhum CNPJ encontrado no arquivo.\n\n💡 Solução: Verifique se a coluna 'CPF/CNPJ do Prestador' está preenchida.", None
        
        if len(cnpjs_unicos) > 1:
            cnpjs_formatados = [f"• {cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}" for cnpj in cnpjs_unicos[:5]]
            erro = f"❌ CSV contém {len(cnpjs_unicos)} CNPJs diferentes:\n"
            erro += "\n".join(cnpjs_formatados)
            if len(cnpjs_unicos) > 5:
                erro += f"\n... (+ {len(cnpjs_unicos) - 5} outros)"
            erro += "\n\n📌 Regra: Cada arquivo CSV deve conter apenas 1 cliente."
            erro += "\n💡 Solução: Separe o arquivo em múltiplos CSVs, um para cada cliente."
            return False, erro, None
        
        cnpj_limpo = cnpjs_unicos[0]
        
        # Valida formato do CNPJ (14 dígitos)
        if len(cnpj_limpo) != 14:
            cnpj_formatado = f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:]}" if len(cnpj_limpo) > 0 else cnpj_limpo
            erro = f"❌ CNPJ inválido: {cnpj_formatado}\n"
            erro += f"📏 O CNPJ deve ter 14 dígitos, mas foi encontrado {len(cnpj_limpo)} dígitos."
            erro += "\n💡 Solução: Verifique se o CNPJ está completo no formato: 00.000.000/0000-00"
            return False, erro, None
        
        return True, "", cnpj_limpo
    
    @classmethod
    def detectar_competencias(cls, df: pd.DataFrame, mapeamento: dict) -> Dict[Tuple[int, int], List[Dict]]:
        """
        Detecta as competências (mês/ano) presentes no CSV
        Agrupa as notas por competência
        Ignora notas canceladas
        
        Args:
            df: DataFrame com os dados
            mapeamento: Dict com mapeamento de colunas
        
        Returns:
            Dict com chave (mes, ano) e valor lista de notas
        """
        df = cls._remover_linhas_totalizadoras(df)
        
        col_data_competencia = mapeamento.get('data_competencia')
        col_data_cancelamento = mapeamento.get('data_cancelamento')
        
        competencias = {}
        
        for idx, row in df.iterrows():
            # Verifica se a nota foi cancelada
            if col_data_cancelamento:
                data_cancelamento = row.get(col_data_cancelamento, '')
                # Se tem data de cancelamento preenchida, ignora esta nota
                if data_cancelamento and not pd.isna(data_cancelamento) and str(data_cancelamento).strip() != '':
                    continue
            
            # Usa a coluna de competência encontrada
            data_str = row.get(col_data_competencia, '')
            
            data = cls.parse_data(data_str)
            
            if data is None:
                continue
            
            chave_competencia = (data.month, data.year)
            
            if chave_competencia not in competencias:
                competencias[chave_competencia] = []
            
            # Extrai dados da nota
            nota = cls._extrair_dados_nota(row, mapeamento)
            nota['competencia_mes'] = data.month
            nota['competencia_ano'] = data.year
            
            competencias[chave_competencia].append(nota)
        
        return competencias
    
    @classmethod
    def _extrair_dados_nota(cls, row: pd.Series, mapeamento: dict) -> Dict:
        """
        Extrai dados relevantes de uma linha do CSV
        
        Args:
            row: Linha do DataFrame
            mapeamento: Dict com mapeamento de colunas
        """
        return {
            'numero_nf': str(row.get(mapeamento.get('numero_nf', ''), '')),
            'cnpj_prestador': cls.limpar_cnpj(row.get(mapeamento.get('cnpj_prestador', ''), '')),
            'razao_social_prestador': str(row.get(mapeamento.get('razao_social_prestador', ''), '')),
            'razao_social_tomador': str(row.get(mapeamento.get('razao_social_tomador', ''), '')),
            'valor': cls.limpar_valor(row.get(mapeamento.get('valor_servicos', ''), 0))
        }
    
    @classmethod
    def processar_arquivo(cls, arquivo_bytes: bytes, nome_arquivo: str) -> Dict:
        """
        Processa um arquivo CSV de NF-e
        
        Returns:
            Dict com dados processados e validados
        """
        resultado = {
            'nome_arquivo': nome_arquivo,
            'status': 'ok',
            'cnpj': None,
            'razao_social': None,
            'competencias': [],
            'total_notas': 0,
            'total_faturamento': Decimal('0'),
            'avisos': [],
            'erros': [],
            'colunas_encontradas': []  # Para debug
        }
        
        try:
            # Lê o CSV
            # Tenta diferentes separadores e encodings
            df = None
            separadores = [';', '\t', ',']  # Ponto e vírgula é o mais comum no Brasil
            
            for separador in separadores:
                for encoding in ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']:
                    try:
                        df = pd.read_csv(
                            io.BytesIO(arquivo_bytes),
                            sep=separador,
                            encoding=encoding,
                            dtype=str
                        )
                        # Verifica se leu corretamente (deve ter múltiplas colunas)
                        if len(df.columns) > 10:
                            break
                    except (UnicodeDecodeError, pd.errors.ParserError):
                        continue
                
                if df is not None and len(df.columns) > 10:
                    break
            
            if df is None or len(df.columns) <= 1:
                erro = "❌ Não foi possível ler o arquivo CSV.\n\n"
                erro += "Possíveis causas:\n"
                erro += "• Arquivo corrompido\n"
                erro += "• Formato inválido\n"
                erro += "• Separador não suportado\n\n"
                erro += "💡 Solução: Exporte novamente o CSV da Prefeitura/SEFAZ e tente novamente."
                raise ValueError(erro)
            
            # Adiciona colunas encontradas para debug
            resultado['colunas_encontradas'] = df.columns.tolist()[:20]  # Primeiras 20
            
            # Valida estrutura e obtém mapeamento de colunas
            valido, msg_erro, mapeamento = cls.validar_estrutura_csv(df)
            if not valido:
                resultado['status'] = 'erro'
                resultado['erros'].append(msg_erro)
                return resultado
            
            # Valida CNPJ único
            valido, msg_erro, cnpj = cls.validar_cnpj_unico(df, mapeamento)
            if not valido:
                resultado['status'] = 'erro'
                resultado['erros'].append(msg_erro)
                return resultado
            
            resultado['cnpj'] = cnpj
            
            # Extrai razão social
            df_limpo = cls._remover_linhas_totalizadoras(df)
            if len(df_limpo) > 0 and mapeamento.get('razao_social_prestador'):
                resultado['razao_social'] = str(df_limpo[mapeamento['razao_social_prestador']].iloc[0])
            
            # Detecta competências
            competencias_dict = cls.detectar_competencias(df, mapeamento)
            
            if not competencias_dict:
                resultado['status'] = 'erro'
                erro = "❌ Nenhuma competência válida encontrada no arquivo.\n\n"
                erro += "Possíveis causas:\n"
                erro += "• Coluna de data está vazia\n"
                erro += "• Formato de data inválido\n"
                erro += "• Todas as notas foram canceladas\n\n"
                erro += "💡 Solução: Verifique se a coluna 'Data de Competência' está preenchida no formato DD/MM/YYYY."
                resultado['erros'].append(erro)
                return resultado
            
            # Monta resultado por competência
            for (mes, ano), notas in competencias_dict.items():
                total_competencia = sum(nota['valor'] for nota in notas)
                
                competencia_info = {
                    'mes': mes,
                    'ano': ano,
                    'total_notas': len(notas),
                    'faturamento_total': float(total_competencia),
                    'notas': [
                        {
                            'numero_nf': nota['numero_nf'],
                            'valor': float(nota['valor']),
                            'razao_social_tomador': nota['razao_social_tomador']
                        }
                        for nota in notas
                    ]
                }
                
                resultado['competencias'].append(competencia_info)
                resultado['total_notas'] += len(notas)
                resultado['total_faturamento'] += total_competencia
            
            # Converte total para float
            resultado['total_faturamento'] = float(resultado['total_faturamento'])
            
            # Avisos
            if len(competencias_dict) > 1:
                resultado['avisos'].append(
                    f"Arquivo contém notas de {len(competencias_dict)} competências diferentes"
                )
            
        except Exception as e:
            resultado['status'] = 'erro'
            resultado['erros'].append(f"Erro ao processar arquivo: {str(e)}")
            import traceback
            resultado['erros'].append(f"Detalhes: {traceback.format_exc()}")
        
        return resultado


def processar_multiplos_arquivos(arquivos: List[Tuple[bytes, str]]) -> Dict:
    """
    Processa múltiplos arquivos CSV
    
    Args:
        arquivos: Lista de tuplas (bytes_arquivo, nome_arquivo)
    
    Returns:
        Dict com resultado do processamento de todos os arquivos
    """
    parser = NFECSVParser()
    
    resultados = []
    total_arquivos_ok = 0
    total_arquivos_erro = 0
    total_geral = Decimal('0')
    
    for arquivo_bytes, nome_arquivo in arquivos:
        resultado = parser.processar_arquivo(arquivo_bytes, nome_arquivo)
        
        if resultado['status'] == 'ok':
            total_arquivos_ok += 1
            total_geral += Decimal(str(resultado['total_faturamento']))
        else:
            total_arquivos_erro += 1
        
        resultados.append(resultado)
    
    return {
        'arquivos_processados': resultados,
        'resumo': {
            'total_arquivos': len(arquivos),
            'arquivos_ok': total_arquivos_ok,
            'arquivos_com_erro': total_arquivos_erro,
            'total_importar': float(total_geral)
        }
    }

