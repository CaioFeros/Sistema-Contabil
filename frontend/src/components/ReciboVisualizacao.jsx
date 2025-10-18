import React, { useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import valorPorExtenso from '../utils/numeroExtenso';

function ReciboVisualizacao({ recibo, onClose }) {
    const reciboRef = useRef();

    const formatarCNPJ = (cnpj) => {
        if (!cnpj) return '';
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    };

    const formatarCPF = (cpf) => {
        if (!cpf) return '';
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const formatarValor = (valor) => {
        if (!valor) return 'R$ 0,00';
        return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
    };

    const obterNomeMes = (mes) => {
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return meses[mes - 1] || '';
    };

    const formatarDataExtenso = (data) => {
        const d = new Date(data);
        const dia = d.getDate().toString().padStart(2, '0');
        const mes = obterNomeMes(d.getMonth() + 1);
        const ano = d.getFullYear();
        return `Rio de Janeiro, ${dia} de ${mes} de ${ano}.`;
    };

    const handleImprimir = () => {
        const printContent = reciboRef.current;
        const printWindow = window.open('', '', 'height=800,width=800');
        
        printWindow.document.write('<html><head><title>Recibo</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body {
                font-family: 'Arial', sans-serif;
                padding: 40px;
                line-height: 1.6;
            }
            .recibo-container {
                max-width: 800px;
                margin: 0 auto;
            }
            .recibo-header {
                text-align: center;
                margin-bottom: 30px;
            }
            .recibo-logo {
                max-height: 80px;
                margin-bottom: 20px;
            }
            .recibo-titulo {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .recibo-numero {
                font-size: 14px;
                color: #666;
                margin-bottom: 20px;
            }
            .recibo-corpo {
                text-align: justify;
                margin: 30px 0;
                font-size: 14px;
            }
            .recibo-servico {
                margin: 30px 0;
                padding: 20px;
                border-top: 1px solid #ccc;
                border-bottom: 1px solid #ccc;
            }
            .linha-servico {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 10px 0;
                border-bottom: 1px dotted #ccc;
            }
            .recibo-rodape {
                margin-top: 40px;
                font-size: 14px;
            }
            .dados-bancarios {
                text-align: left;
                font-size: 13px;
                line-height: 1.8;
                margin-bottom: 30px;
            }
            .recibo-assinatura {
                text-align: center;
                margin: 30px 0 10px 0;
            }
            .dados-contador {
                text-align: center;
                margin: 10px 0 30px 0;
                font-size: 13px;
                line-height: 1.6;
            }
            .assinatura-imagem {
                max-height: 60px;
                margin: 0 auto 10px auto;
                display: block;
            }
            .data-local {
                text-align: right;
                margin-top: 60px;
                font-size: 14px;
            }
            @media print {
                body {
                    padding: 20px;
                }
            }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (!recibo || !recibo.cliente || !recibo.contador) {
        return (
            <div className="text-center p-8">
                <p>Carregando dados do recibo...</p>
            </div>
        );
    }

    const descricaoServico = recibo.tipo_servico === 'honorarios'
        ? `Honorários ${obterNomeMes(recibo.mes)} de ${recibo.ano}`
        : recibo.descricao_servico;

    return (
        <div className="space-y-4">
            {/* Barra de ações */}
            <div className="flex justify-end gap-2 no-print">
                <button
                    onClick={handleImprimir}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Printer className="w-5 h-5" />
                    Imprimir
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Fechar
                    </button>
                )}
            </div>

            {/* Recibo */}
            <div ref={reciboRef} className="bg-white p-8 rounded-lg shadow-lg">
                <div className="recibo-container max-w-4xl mx-auto">
                    {/* Cabeçalho */}
                    <div className="recibo-header text-center mb-8">
                        {recibo.contador.imagem_logo && (
                            <img
                                src={recibo.contador.imagem_logo}
                                alt="Logo"
                                className="recibo-logo max-h-20 mx-auto mb-6"
                            />
                        )}
                        <h1 className="recibo-titulo text-3xl font-bold mb-2">RECIBO</h1>
                        <p className="recibo-numero text-gray-600">Nº {recibo.numero_recibo}</p>
                    </div>

                    {/* Corpo do recibo */}
                    <div className="recibo-corpo text-justify leading-relaxed mb-8">
                        <p className="mb-6">
                            Recebi da Empresa <strong>{recibo.cliente.razao_social}</strong>, inscrita no
                            CNPJ nº <strong>{formatarCNPJ(recibo.cliente.cnpj)}</strong>, a quantia de{' '}
                            <strong>{formatarValor(recibo.valor)}</strong> (<strong>{valorPorExtenso(Number(recibo.valor))}</strong>), 
                            referente aos seguintes serviços prestados:
                        </p>
                    </div>

                    {/* Discriminação do serviço */}
                    <div className="recibo-servico border-t border-b border-gray-300 py-6 my-8">
                        <div className="linha-servico flex justify-between items-center py-4">
                            <span className="flex-1">{descricaoServico}</span>
                            <span className="font-mono">
                                {'-------------------------------'}
                            </span>
                            <span className="ml-4 font-semibold">{formatarValor(recibo.valor)}</span>
                        </div>
                    </div>

                    {/* Rodapé */}
                    <div className="recibo-rodape mt-12">
                        <p className="mb-8">E para maior clareza, firmo o presente.</p>
                        
                        {/* Dados Bancários - Esquerda */}
                        <div className="dados-bancarios text-left mt-16 mb-8">
                            <p className="font-semibold mb-3">Dados Bancários:</p>
                            <p>PIX: {recibo.contador.pix}</p>
                            <p>Banco – {recibo.contador.banco}</p>
                            <p>Ag: {recibo.contador.agencia}</p>
                            <p>C/C: {recibo.contador.conta_corrente}</p>
                        </div>

                        {/* Assinatura - Completamente Centralizada */}
                        <div className="recibo-assinatura text-center mt-8">
                            {recibo.contador.imagem_assinatura && (
                                <div className="mb-2">
                                    <img
                                        src={recibo.contador.imagem_assinatura}
                                        alt="Assinatura"
                                        className="assinatura-imagem max-h-16 mx-auto"
                                    />
                                </div>
                            )}
                            <div className="border-t border-gray-400 w-64 mx-auto pt-1">
                            </div>
                        </div>

                        {/* Dados do contador imediatamente abaixo da assinatura */}
                        <div className="dados-contador text-center mt-2 mb-8">
                            <p className="font-semibold text-base">{recibo.contador.nome}</p>
                            <p className="text-sm">CPF/MF nº {formatarCPF(recibo.contador.cpf)}</p>
                            <p className="text-sm">CRC nº {recibo.contador.crc}</p>
                        </div>

                        {/* Data e local - Último elemento, canto direito */}
                        <div className="data-local text-right mt-16">
                            <p>{formatarDataExtenso(recibo.data_emissao)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReciboVisualizacao;

