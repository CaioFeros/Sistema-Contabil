import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  Building,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { consolidarCSV, uploadPreviewCSV } from '../services/importacaoApi';
import { formatCurrency } from '../utils/formatters';
import CadastroClienteModal from './CadastroClienteModal';
import { formatarErroImportacao } from '../utils/errosImportacao';
import ErroDetalhado from './ErroDetalhado';

/**
 * Componente para exibir preview dos dados importados
 * e permitir conferência antes de consolidar
 */
const PreviewImportacao = ({ dadosPreview: dadosPreviewInicial, onConsolidacaoCompleta, onCancelar }) => {
  const [consolidando, setConsolidando] = useState(false);
  const [erro, setErro] = useState(null); // Agora é objeto
  const [arquivosExpandidos, setArquivosExpandidos] = useState({});
  const [dadosPreview, setDadosPreview] = useState(dadosPreviewInicial);
  
  // Estado para controlar qual arquivo precisa de cadastro
  const [clienteParaCadastrar, setClienteParaCadastrar] = useState(null);
  
  // Estado para arquivos selecionados
  const [arquivosSelecionados, setArquivosSelecionados] = useState(() => {
    const inicial = {};
    dadosPreviewInicial.arquivos_processados.forEach(arquivo => {
      inicial[arquivo.id_temporario] = arquivo.status === 'ok';
    });
    return inicial;
  });
  
  // Estado para substituições por competência
  const [substituicoesPorCompetencia, setSubstituicoesPorCompetencia] = useState({});
  
  // Estados para barra de progresso
  const [progressoAtual, setProgressoAtual] = useState(0);
  const [progressoTotal, setProgressoTotal] = useState(0);
  const [arquivoAtual, setArquivoAtual] = useState('');
  const [competenciaAtual, setCompetenciaAtual] = useState('');

  // Verifica se há clientes não cadastrados ao carregar
  useEffect(() => {
    const arquivoNaoCadastrado = dadosPreview.arquivos_processados.find(
      arquivo => arquivo.status === 'nao_cadastrado' || arquivo.precisa_cadastrar
    );
    
    if (arquivoNaoCadastrado) {
      setClienteParaCadastrar({
        cnpj: arquivoNaoCadastrado.cnpj,
        razaoSocial: arquivoNaoCadastrado.razao_social,
        arquivoId: arquivoNaoCadastrado.id_temporario
      });
    }
  }, [dadosPreview]);

  const toggleArquivoExpandido = (id) => {
    setArquivosExpandidos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleArquivoSelecionado = (id) => {
    setArquivosSelecionados(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSubstituicaoCompetencia = (arquivoId, mes, ano) => {
    const chave = `${mes}_${ano}`;
    setSubstituicoesPorCompetencia(prev => ({
      ...prev,
      [arquivoId]: {
        ...prev[arquivoId],
        [chave]: !prev[arquivoId]?.[chave]
      }
    }));
  };

  const handleClienteCadastrado = async (cliente) => {
    // Fecha o modal
    setClienteParaCadastrar(null);
    
    // Reprocessa o preview com o novo cliente cadastrado
    // Simula um re-upload apenas do arquivo problemático
    try {
      // Atualiza o dadosPreview com o cliente cadastrado
      const novosArquivos = dadosPreview.arquivos_processados.map(arquivo => {
        if (arquivo.id_temporario === clienteParaCadastrar.arquivoId) {
          return {
            ...arquivo,
            status: 'ok',
            precisa_cadastrar: false,
            cliente_info: {
              id: cliente.id,
              razao_social: cliente.razao_social,
              cnpj_formatado: cliente.cnpj
            },
            avisos: arquivo.avisos.filter(a => !a.includes('não está cadastrado'))
          };
        }
        return arquivo;
      });
      
      setDadosPreview({
        ...dadosPreview,
        arquivos_processados: novosArquivos
      });
      
      // Marca o arquivo como selecionado
      setArquivosSelecionados(prev => ({
        ...prev,
        [clienteParaCadastrar.arquivoId]: true
      }));
      
    } catch (error) {
      console.error('Erro ao atualizar preview:', error);
      setErro('Erro ao atualizar dados após cadastro do cliente');
    }
  };

  const handleCancelarCadastro = () => {
    setClienteParaCadastrar(null);
    // Remove o arquivo da seleção
    if (clienteParaCadastrar) {
      setArquivosSelecionados(prev => ({
        ...prev,
        [clienteParaCadastrar.arquivoId]: false
      }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'aviso':
      case 'nao_cadastrado':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'erro':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'ok':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'aviso':
      case 'nao_cadastrado':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'erro':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const handleConsolidar = async () => {
    // Filtra apenas arquivos selecionados e com status ok
    const arquivosParaConsolidar = dadosPreview.arquivos_processados.filter(
      arquivo => arquivosSelecionados[arquivo.id_temporario] && arquivo.status === 'ok'
    );

    if (arquivosParaConsolidar.length === 0) {
      setErro({
        categoria: 'validacao',
        titulo: 'Nenhum Arquivo Selecionado',
        mensagem: 'Você precisa selecionar pelo menos um arquivo válido para consolidar.',
        solucao: 'Marque os checkboxes ao lado dos arquivos que deseja importar e tente novamente.',
        detalhes: null
      });
      return;
    }

    // Calcula total de competências a processar
    const totalCompetencias = arquivosParaConsolidar.reduce((acc, arquivo) => {
      return acc + (arquivo.competencias?.length || 0);
    }, 0);

    setConsolidando(true);
    setErro(null);
    setProgressoAtual(0);
    setProgressoTotal(totalCompetencias);

    const TEMPO_MINIMO_MS = 3000; // 3 segundos mínimo para garantir visibilidade
    const tempoInicio = Date.now();

    try {
      // Simula progresso gradual (0% até 90% antes da API completar)
      const progressoSimulado = async () => {
        // Calcula quantos passos fazer (baseado no total de competências)
        // Vai até 90% do total, deixando 10% para quando API retornar
        const passosFinal = Math.ceil(totalCompetencias * 0.9);
        const steps = Math.max(1, passosFinal); // Pelo menos 1 passo
        
        const intervalo = TEMPO_MINIMO_MS / (steps + 3); // Distribui o tempo
        
        for (let i = 0; i < steps; i++) {
          await new Promise(resolve => setTimeout(resolve, intervalo));
          setProgressoAtual(Math.min(i + 1, totalCompetencias - 1)); // NUNCA ultrapassa total-1
        }
      };

      // Inicia progresso simulado em paralelo
      const progressoPromise = progressoSimulado();

      // Aguarda pelo menos 1.5 segundos antes de chamar a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Executa a consolidação real
      const resultadoPromise = consolidarCSV(arquivosParaConsolidar, substituicoesPorCompetencia);
      
      // Aguarda ambos (progresso e API)
      const [_, resultado] = await Promise.all([progressoPromise, resultadoPromise]);

      // Completa o progresso para 100% (nunca ultrapassa)
      setProgressoAtual(totalCompetencias);

      // Calcula tempo decorrido total
      const tempoDecorrido = Date.now() - tempoInicio;
      const tempoRestante = Math.max(0, TEMPO_MINIMO_MS - tempoDecorrido);

      // Aguarda o tempo mínimo antes de fechar
      await new Promise(resolve => setTimeout(resolve, tempoRestante));
      
      // Mostra 100% por mais 800ms antes de fechar
      await new Promise(resolve => setTimeout(resolve, 800));

      // Chama callback de sucesso
      onConsolidacaoCompleta(resultado);

    } catch (error) {
      console.error('Erro na consolidação:', error);
      
      // Usa o formatador de erros
      const erroFormatado = formatarErroImportacao(error);
      
      // Adiciona contexto específico de consolidação
      erroFormatado.categoria = 'consolidacao';
      if (!erroFormatado.solucao) {
        erroFormatado.solucao = 'Verifique se:\n• O cliente está cadastrado\n• Não há problemas com as competências duplicadas\n• Os dados estão corretos';
      }
      
      setErro(erroFormatado);
    } finally {
      setConsolidando(false);
      setProgressoAtual(0);
      setProgressoTotal(0);
    }
  };

  const totalSelecionados = Object.values(arquivosSelecionados).filter(Boolean).length;
  const totalFaturamento = dadosPreview.arquivos_processados
    .filter(arquivo => arquivosSelecionados[arquivo.id_temporario] && arquivo.status === 'ok')
    .reduce((acc, arquivo) => acc + (arquivo.total_faturamento || 0), 0);

  return (
    <>
      {/* Modal de Cadastro de Cliente */}
      {clienteParaCadastrar && (
        <CadastroClienteModal
          cnpj={clienteParaCadastrar.cnpj}
          razaoSocial={clienteParaCadastrar.razaoSocial}
          onCadastrado={handleClienteCadastrado}
          onCancelar={handleCancelarCadastro}
        />
      )}

      <div className="space-y-6">
        {/* Resumo Geral */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Conferência de Importação</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <FileText className="h-6 w-6 mb-2" />
              <p className="text-sm opacity-90">Arquivos</p>
              <p className="text-2xl font-bold">{dadosPreview.resumo.total_arquivos}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <CheckCircle className="h-6 w-6 mb-2" />
              <p className="text-sm opacity-90">Válidos</p>
              <p className="text-2xl font-bold">{dadosPreview.resumo.arquivos_ok}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <XCircle className="h-6 w-6 mb-2" />
              <p className="text-sm opacity-90">Com Erro</p>
              <p className="text-2xl font-bold">{dadosPreview.resumo.arquivos_com_erro}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <DollarSign className="h-6 w-6 mb-2" />
              <p className="text-sm opacity-90">Faturamento Total</p>
              <p className="text-2xl font-bold">{formatCurrency(dadosPreview.resumo.total_importar)}</p>
            </div>
          </div>
        </div>

        {/* Lista de Arquivos */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Detalhamento por Arquivo
          </h3>

          {dadosPreview.arquivos_processados.map((arquivo) => (
            <div
              key={arquivo.id_temporario}
              className={`border rounded-lg overflow-hidden ${getStatusBgColor(arquivo.status)}`}
            >
              {/* Cabeçalho do Arquivo */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Checkbox de seleção */}
                    {arquivo.status === 'ok' && (
                      <input
                        type="checkbox"
                        checked={arquivosSelecionados[arquivo.id_temporario] || false}
                        onChange={() => toggleArquivoSelecionado(arquivo.id_temporario)}
                        className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {/* Ícone de status */}
                    {getStatusIcon(arquivo.status)}

                    {/* Informações do arquivo */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {arquivo.nome_arquivo}
                      </h4>

                      {/* Informações do cliente */}
                      {arquivo.cliente_info && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Cliente:</span>{' '}
                            {arquivo.cliente_info.razao_social}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">CNPJ:</span>{' '}
                            {arquivo.cnpj || arquivo.cliente_info.cnpj_formatado}
                          </p>
                        </div>
                      )}

                      {/* Precisa cadastrar */}
                      {arquivo.precisa_cadastrar && (
                        <div className="mt-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Building className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                            <span className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
                              Cliente não cadastrado
                            </span>
                          </div>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                            CNPJ: {arquivo.cnpj}
                            {arquivo.razao_social && ` - ${arquivo.razao_social}`}
                          </p>
                          <button
                            onClick={() => setClienteParaCadastrar({
                              cnpj: arquivo.cnpj,
                              razaoSocial: arquivo.razao_social,
                              arquivoId: arquivo.id_temporario
                            })}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                          >
                            Cadastrar Agora
                          </button>
                        </div>
                      )}

                      {/* Competências */}
                      {arquivo.competencias && arquivo.competencias.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {arquivo.competencias.map((comp, idx) => (
                            <div
                              key={idx}
                              className="bg-white dark:bg-gray-700 rounded p-3 text-sm"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="font-semibold">
                                    {String(comp.mes).padStart(2, '0')}/{comp.ano}
                                  </span>
                                  {comp.ja_existe && (
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded">
                                      Já existe
                                    </span>
                                  )}
                                </div>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(comp.faturamento_total)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                                <span>{comp.total_notas} nota(s)</span>
                                {comp.ja_existe && comp.faturamento_anterior > 0 && (
                                  <span className="text-xs">
                                    Anterior: {formatCurrency(comp.faturamento_anterior)}
                                  </span>
                                )}
                              </div>

                              {/* Alerta de notas duplicadas */}
                              {comp.total_duplicadas > 0 && (
                                <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded">
                                  <div className="flex items-start space-x-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                                        {comp.total_duplicadas} nota(s) duplicada(s) detectada(s)
                                      </p>
                                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                        Estas notas já existem no banco de dados. Se você substituir a competência, 
                                        elas serão substituídas pelos novos valores.
                                      </p>
                                      {comp.notas_duplicadas && comp.notas_duplicadas.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                                            Notas duplicadas:
                                          </p>
                                          <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
                                            {comp.notas_duplicadas.slice(0, 5).map((dup, idx) => (
                                              <li key={idx}>
                                                • NF {dup.numero_nf} - {formatCurrency(dup.valor)}
                                                {dup.tomador && ` (${dup.tomador.substring(0, 30)}...)`}
                                              </li>
                                            ))}
                                            {comp.notas_duplicadas.length > 5 && (
                                              <li className="font-medium">
                                                + {comp.notas_duplicadas.length - 5} outras...
                                              </li>
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Checkbox para substituir esta competência */}
                              {comp.ja_existe && arquivo.status === 'ok' && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                  <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={substituicoesPorCompetencia[arquivo.id_temporario]?.[`${comp.mes}_${comp.ano}`] || false}
                                      onChange={() => toggleSubstituicaoCompetencia(arquivo.id_temporario, comp.mes, comp.ano)}
                                      className="h-4 w-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                                    />
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                      Substituir competência existente
                                    </span>
                                  </label>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                                    ⚠️ Os dados antigos serão apagados permanentemente
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Avisos */}
                      {arquivo.avisos && arquivo.avisos.length > 0 && !arquivo.precisa_cadastrar && (
                        <div className="mt-3 space-y-1">
                          {arquivo.avisos.map((aviso, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-yellow-700 dark:text-yellow-400">{aviso}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Erros */}
                      {arquivo.erros && arquivo.erros.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {arquivo.erros.map((erro, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-red-700 dark:text-red-400">{erro}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botão expandir/recolher */}
                  {arquivo.competencias && arquivo.competencias.length > 0 && (
                    <button
                      onClick={() => toggleArquivoExpandido(arquivo.id_temporario)}
                      className="ml-4 p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
                    >
                      {arquivosExpandidos[arquivo.id_temporario] ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Detalhes expandidos (notas) */}
              {arquivosExpandidos[arquivo.id_temporario] && arquivo.competencias && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                  {arquivo.competencias.map((comp, compIdx) => (
                    <div key={compIdx} className="mb-4 last:mb-0">
                      <h5 className="font-semibold mb-2 text-gray-900 dark:text-white">
                        Notas de {String(comp.mes).padStart(2, '0')}/{comp.ano}
                      </h5>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {comp.notas.map((nota, notaIdx) => (
                          <div
                            key={notaIdx}
                            className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm"
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">NF {nota.numero_nf}</span>
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(nota.valor)}
                              </span>
                            </div>
                            {nota.razao_social_tomador && (
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                <span className="font-medium">Tomador:</span> {nota.razao_social_tomador}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Barra de Progresso */}
        {consolidando && progressoTotal > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="space-y-4">
              {/* Texto do progresso */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                    Consolidando Dados...
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Processando {progressoAtual} de {progressoTotal} competência(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {progressoTotal > 0 ? Math.round((progressoAtual / progressoTotal) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="relative">
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-end px-2"
                    style={{ width: `${progressoTotal > 0 ? (progressoAtual / progressoTotal) * 100 : 0}%` }}
                  >
                    {progressoAtual > 0 && (
                      <span className="text-xs font-bold text-white">
                        {progressoAtual}/{progressoTotal}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Animação de loading */}
              <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-400">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Calculando impostos e salvando dados no banco...</span>
              </div>

              {/* Mensagem informativa */}
              <div className="bg-blue-100 dark:bg-blue-900/40 rounded p-3 text-xs text-blue-700 dark:text-blue-300">
                ⏳ Este processo pode levar alguns segundos. Por favor, não feche esta janela.
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {erro && !consolidando && (
          <ErroDetalhado 
            erro={erro} 
            onFechar={() => setErro(null)} 
          />
        )}

        {/* Ações */}
        <div className={`flex items-center justify-between rounded-lg p-4 transition-colors ${
          consolidando 
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
            : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <div>
            <p className={`font-semibold ${consolidando ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
              {consolidando 
                ? `Processando ${totalSelecionados} arquivo(s)...` 
                : `${totalSelecionados} arquivo(s) selecionado(s)`
              }
            </p>
            <p className={`text-sm ${consolidando ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {consolidando
                ? `Total: ${formatCurrency(totalFaturamento)}`
                : `Total a importar: ${formatCurrency(totalFaturamento)}`
              }
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCancelar}
              disabled={consolidando}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConsolidar}
              disabled={consolidando || totalSelecionados === 0}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {consolidando ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Consolidando...
                </>
              ) : (
                `Consolidar ${totalSelecionados} arquivo(s)`
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PreviewImportacao;
