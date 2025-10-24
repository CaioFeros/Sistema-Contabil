"""
Módulo para geração de PDFs profissionais de contratos
Formatação adequada para protocolos em repartições públicas
"""
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime


class NumeredCanvas(canvas.Canvas):
    """Canvas customizado para adicionar numeração de páginas"""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        """Adiciona número de página no rodapé"""
        self.setFont("Helvetica", 9)
        self.drawRightString(
            A4[0] - 2*cm,
            1.5*cm,
            f"Página {self._pageNumber} de {page_count}"
        )


def gerar_pdf_contrato(contrato):
    """
    Gera PDF profissional de um contrato
    
    Args:
        contrato: Objeto Contrato do banco de dados
    
    Returns:
        BytesIO: Buffer com o PDF gerado
    """
    # Cria buffer em memória
    buffer = BytesIO()
    
    # Configuração do documento
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2.5*cm,
        title=contrato.titulo,
        author="Sistema Contábil"
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo para título
    style_titulo = ParagraphStyle(
        'TituloContrato',
        parent=styles['Heading1'],
        fontSize=14,
        textColor=colors.black,
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=18
    )
    
    # Estilo para subtítulos (seções em maiúsculas)
    style_subtitulo = ParagraphStyle(
        'SubtituloContrato',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.black,
        spaceAfter=12,
        spaceBefore=16,
        fontName='Helvetica-Bold',
        leading=14,
        alignment=TA_JUSTIFY  # Justificado também
    )
    
    # Estilo para corpo do texto (justificado, sem negrito)
    style_corpo = ParagraphStyle(
        'CorpoContrato',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.black,
        alignment=TA_JUSTIFY,  # Justificado
        fontName='Helvetica',  # SEM negrito
        leading=16,
        spaceAfter=10,
        firstLineIndent=0,
        wordWrap='LTR'
    )
    
    # Estilo para cláusulas (justificado, com formatação inline)
    style_clausula = ParagraphStyle(
        'ClausulaContrato',
        parent=style_corpo,
        fontName='Helvetica',  # SEM negrito (usaremos tags <b> inline)
        spaceAfter=8,
        spaceBefore=14,
        alignment=TA_JUSTIFY  # Justificado
    )
    
    # Estilo para assinaturas
    style_assinatura = ParagraphStyle(
        'AssinaturaContrato',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.black,
        alignment=TA_CENTER,
        fontName='Helvetica',
        leading=14,
        spaceAfter=8
    )
    
    # Estilo para informações do cabeçalho
    style_info = ParagraphStyle(
        'InfoContrato',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
        alignment=TA_RIGHT,
        fontName='Helvetica',
        spaceAfter=20
    )
    
    # Conteúdo do PDF
    elementos = []
    
    # Processa o conteúdo do contrato diretamente (sem título adicional)
    # O título já vem no conteúdo gerado do template
    conteudo = contrato.conteudo_gerado
    
    # Divide o conteúdo em linhas e processa
    linhas = conteudo.split('\n')
    
    for linha in linhas:
        linha = linha.strip()
        
        if not linha:
            # Linha vazia - adiciona espaço
            elementos.append(Spacer(1, 0.3*cm))
            continue
        
        # Escapa caracteres especiais do XML/HTML primeiro
        linha_escapada = linha.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        
        # Detecta se é uma cláusula (CLÁUSULA [NÚMERO/PALAVRA] - resto)
        # Formato: "CLÁUSULA PRIMEIRA - texto" ou "CLÁUSULA 1 - texto"
        clausula_match = re.match(r'^(CLÁUSULA\s+[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]+|CLÁUSULA\s+\d+|ARTIGO\s+\d+|PARÁGRAFO\s+[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]+|PARÁGRAFO\s+\d+)\s*([-–:])\s*(.*)$', linha_escapada, re.IGNORECASE)
        
        if clausula_match:
            # Separa a parte da cláusula (negrito) do resto (normal)
            inicio_negrito = clausula_match.group(1).upper()  # CLÁUSULA PRIMEIRA
            separador = clausula_match.group(2)  # - ou : ou –
            resto = clausula_match.group(3)  # resto do texto
            
            # Formata: <b>CLÁUSULA PRIMEIRA</b> - resto do texto
            linha_formatada = f'<b>{inicio_negrito}</b> {separador} {resto}'
            elementos.append(Paragraph(linha_formatada, style_clausula))
        
        # Detecta se é um título de seção (em maiúsculas, sem pontuação no início)
        elif linha.isupper() and len(linha) < 150 and not linha.startswith('_') and not linha.startswith('-'):
            elementos.append(Spacer(1, 0.2*cm))
            # Títulos em negrito
            elementos.append(Paragraph(f'<b>{linha_escapada}</b>', style_subtitulo))
        
        # Detecta linhas de assinatura
        elif linha.startswith('_____') or ('CPF' in linha.upper() and ':' in linha) or ('RG' in linha.upper() and ':' in linha):
            elementos.append(Spacer(1, 0.4*cm))
            elementos.append(Paragraph(linha_escapada.replace('_', '&nbsp;'), style_assinatura))
        
        # Texto normal (parágrafos justificados, sem negrito)
        else:
            elementos.append(Paragraph(linha_escapada, style_corpo))
    
    # Adiciona espaço no final para assinaturas
    elementos.append(Spacer(1, 1*cm))
    
    # Rodapé do documento
    if contrato.observacoes:
        elementos.append(Spacer(1, 1*cm))
        elementos.append(Paragraph('<b>Observações:</b>', style_corpo))
        elementos.append(Paragraph(contrato.observacoes, style_corpo))
    
    # Gera o PDF
    doc.build(elementos, canvasmaker=NumeredCanvas)
    
    # Retorna o buffer
    buffer.seek(0)
    return buffer


def gerar_pdf_contrato_simples(titulo, conteudo, numero_contrato=None):
    """
    Versão simplificada para gerar PDF de qualquer texto
    
    Args:
        titulo: Título do documento
        conteudo: Conteúdo do texto
        numero_contrato: Número do contrato (opcional)
    
    Returns:
        BytesIO: Buffer com o PDF gerado
    """
    buffer = BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2.5*cm,
        title=titulo
    )
    
    styles = getSampleStyleSheet()
    
    style_titulo = ParagraphStyle(
        'Titulo',
        parent=styles['Heading1'],
        fontSize=14,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=20
    )
    
    style_corpo = ParagraphStyle(
        'Corpo',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        fontName='Helvetica',
        leading=16,
        spaceAfter=10
    )
    
    elementos = []
    
    # Número do documento
    if numero_contrato:
        style_numero = ParagraphStyle(
            'Numero',
            parent=styles['Normal'],
            fontSize=9,
            alignment=TA_RIGHT,
            textColor=colors.grey
        )
        elementos.append(Paragraph(f"Documento: {numero_contrato}", style_numero))
        elementos.append(Spacer(1, 0.5*cm))
    
    # Título
    elementos.append(Paragraph(titulo.upper(), style_titulo))
    elementos.append(Spacer(1, 0.5*cm))
    
    # Conteúdo
    paragrafos = conteudo.split('\n')
    for paragrafo in paragrafos:
        if paragrafo.strip():
            paragrafo_escapado = paragrafo.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            elementos.append(Paragraph(paragrafo_escapado, style_corpo))
    
    doc.build(elementos, canvasmaker=NumeredCanvas)
    
    buffer.seek(0)
    return buffer

