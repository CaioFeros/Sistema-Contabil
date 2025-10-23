import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarCNAE, buscarEstatisticasCNAE, listarTodosCNAE } from '../services/cnaeService';
import { Search, Info, TrendingUp, Database, Layers, List } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';

const ConsultaCNAE = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  
  const [termoBusca, setTermoBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [cnaeSelecionado, setCnaeSelecionado] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [modoListagem, setModoListagem] = useState(false); // false = busca, true = listagem
  
  // Debounce para busca dinâmica
  const [timeoutId, setTimeoutId] = useState(null);

  // Carregar estatísticas ao montar o componente
  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const stats = await buscarEstatisticasCNAE();
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Função para listar todos os CNAEs
  const listarTodos = async (pagina = 1) => {
    setCarregando(true);
    setErro(null);
    setModoListagem(true);
    setTermoBusca(''); // Limpa o campo de busca

    try {
      const dados = await listarTodosCNAE(pagina, 50);
      
      console.log('Dados recebidos da listagem:', dados);
      
      if (!dados || !dados.resultados) {
        throw new Error('Resposta inválida da API');
      }
      
      setResultados(dados.resultados);
      setPaginaAtual(dados.pagina_atual);
      setTotalPaginas(dados.total_paginas);
      
      if (dados.resultados.length === 0) {
        setErro('Nenhum CNAE encontrado no banco de dados.');
      }
    } catch (error) {
      console.error('Erro ao listar CNAEs:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      setErro('Erro ao listar CNAEs. Tente novamente.');
      setResultados([]);
    } finally {
      setCarregando(false);
    }
  };

  // Função de busca com debounce
  const realizarBusca = useCallback(async (termo) => {
    if (!termo || termo.length < 2) {
      setResultados([]);
      setErro(null);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const dados = await buscarCNAE(termo, 100);
      
      // Validação defensiva da resposta
      if (!dados) {
        throw new Error('Resposta vazia da API');
      }
      
      const resultadosArray = Array.isArray(dados.resultados) ? dados.resultados : [];
      setResultados(resultadosArray);
      
      if (resultadosArray.length === 0) {
        setErro('Nenhum CNAE encontrado com esse critério.');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      setErro('Erro ao buscar CNAEs. Tente novamente.');
      setResultados([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Handler do input com debounce
  const handleBuscaChange = (e) => {
    const valor = e.target.value;
    setTermoBusca(valor);
    setModoListagem(false); // Sai do modo listagem ao digitar

    // Limpar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Criar novo timeout para busca (300ms de delay)
    const novoTimeout = setTimeout(() => {
      realizarBusca(valor);
    }, 300);

    setTimeoutId(novoTimeout);
  };

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const handleSelecionarCNAE = (cnae) => {
    setCnaeSelecionado(cnaeSelecionado?.codigo === cnae.codigo ? null : cnae);
  };

  const getCorSecao = (codigoSecao) => {
    const cores = {
      'A': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'B': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'C': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'D': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'E': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'F': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'G': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'H': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'I': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'J': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'K': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
      'L': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'M': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'N': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
      'O': 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
      'P': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      'Q': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
      'R': 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
      'S': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      'T': 'bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-200',
      'U': 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200'
    };
    return cores[codigoSecao] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <>
      {/* Botão Voltar - Padrão do sistema */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-opacity-90 dark:bg-dark-muted transition-colors"
      >
        &larr; Voltar à página anterior
      </button>
      
      {/* Título */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
          Consulta CNAE
        </h1>
        <p className="mt-2 text-muted-foreground dark:text-dark-muted-foreground">
          Busque atividades econômicas por código ou descrição
        </p>
      </div>

      <div>
        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>Total de CNAEs</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.primary }}>{estatisticas.total_cnaes}</p>
                </div>
                <Database size={32} style={{ color: colors.primary }} className="opacity-50" />
              </div>
            </div>

            <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>Seções</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.primary }}>{estatisticas.total_secoes}</p>
                </div>
                <Layers size={32} style={{ color: colors.primary }} className="opacity-50" />
              </div>
            </div>

            <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>Divisões</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.primary }}>{estatisticas.total_divisoes}</p>
                </div>
                <TrendingUp size={32} style={{ color: colors.primary }} className="opacity-50" />
              </div>
            </div>

            <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>Grupos</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.primary }}>{estatisticas.total_grupos}</p>
                </div>
                <Info size={32} style={{ color: colors.primary }} className="opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Campo de Busca */}
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} style={{ color: colors.textSecondary }} />
              </div>
              <input
                type="text"
                value={termoBusca}
                onChange={handleBuscaChange}
                placeholder="Digite o código ou descrição do CNAE (mínimo 2 caracteres)..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:outline-none"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  '--tw-ring-color': colors.primary
                }}
              />
            </div>
            
            {/* Botão Listar Todos */}
            <button
              onClick={() => listarTodos(1)}
              disabled={carregando}
              className="px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              style={{
                backgroundColor: colors.primary,
                color: 'white'
              }}
            >
              <List size={20} />
              Listar Todos
            </button>
          </div>
          
          {termoBusca && termoBusca.length < 2 && !modoListagem && (
            <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
              Digite pelo menos 2 caracteres para buscar
            </p>
          )}
          
          {modoListagem && (
            <p className="mt-2 text-sm" style={{ color: colors.primary }}>
              Mostrando todos os CNAEs - Página {paginaAtual} de {totalPaginas}
            </p>
          )}
        </div>

        {/* Loading */}
        {carregando && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
            <p className="mt-4" style={{ color: colors.textSecondary }}>Buscando CNAEs...</p>
          </div>
        )}

        {/* Erro */}
        {erro && !carregando && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200">{erro}</p>
          </div>
        )}

        {/* Resultados */}
        {!carregando && resultados.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} {modoListagem ? 'nesta página' : 'encontrado' + (resultados.length !== 1 ? 's' : '')}
              </h2>
              
              {/* Paginação */}
              {modoListagem && totalPaginas > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => listarTodos(paginaAtual - 1)}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1" style={{ color: colors.text }}>
                    {paginaAtual} / {totalPaginas}
                  </span>
                  <button
                    onClick={() => listarTodos(paginaAtual + 1)}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {resultados.map((cnae) => (
                <div
                  key={cnae.codigo}
                  className="border rounded-lg overflow-hidden transition-all cursor-pointer hover:shadow-md"
                  style={{ borderColor: colors.border, backgroundColor: colors.surface }}
                  onClick={() => handleSelecionarCNAE(cnae)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-mono font-bold" style={{ color: colors.primary }}>
                            {cnae.codigo}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getCorSecao(cnae.secao.codigo)}`}>
                            Seção {cnae.secao.codigo}
                          </span>
                        </div>
                        
                        {/* Descrição da Seção */}
                        <div className="mb-2 pl-1">
                          <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                            {cnae.secao.descricao}
                          </p>
                        </div>
                        
                        <p className="text-base font-medium" style={{ color: colors.text }}>
                          {cnae.descricao}
                        </p>
                      </div>
                      <button
                        className="ml-4 text-sm underline"
                        style={{ color: colors.primary }}
                      >
                        {cnaeSelecionado?.codigo === cnae.codigo ? 'Ocultar' : 'Ver'} detalhes
                      </button>
                    </div>

                    {/* Detalhes expandidos */}
                    {cnaeSelecionado?.codigo === cnae.codigo && (
                      <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: colors.border }}>
                        {/* Informações do Simples Nacional */}
                        {cnae.simples_nacional && (
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <p className="text-sm font-bold mb-2" style={{ color: colors.primary }}>
                              📊 Informações do Simples Nacional
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-semibold" style={{ color: colors.textSecondary }}>Permitido:</span>
                                <span className={`ml-2 ${cnae.simples_nacional.permitido ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {cnae.simples_nacional.permitido ? '✓ Sim' : '✗ Não'}
                                </span>
                              </div>
                              
                              {cnae.simples_nacional.anexo && (
                                <div>
                                  <span className="font-semibold" style={{ color: colors.textSecondary }}>Anexo:</span>
                                  <span className="ml-2 font-bold" style={{ color: colors.primary }}>
                                    {cnae.simples_nacional.anexo}
                                  </span>
                                </div>
                              )}
                              
                              <div>
                                <span className="font-semibold" style={{ color: colors.textSecondary }}>Fator R:</span>
                                <span className={`ml-2 ${cnae.simples_nacional.tem_fator_r ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {cnae.simples_nacional.tem_fator_r ? 'Sim' : 'Não'}
                                </span>
                              </div>
                              
                              <div>
                                <span className="font-semibold" style={{ color: colors.textSecondary }}>Insc. Estadual:</span>
                                <span className={`ml-2 ${cnae.simples_nacional.obriga_inscricao_estadual ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {cnae.simples_nacional.obriga_inscricao_estadual ? 'Obrigatória' : 'Não obrigatória'}
                                </span>
                              </div>
                              
                              {cnae.simples_nacional.aliquota_estimada && (
                                <div className="col-span-2">
                                  <span className="font-semibold" style={{ color: colors.textSecondary }}>Alíquota Estimada:</span>
                                  <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                                    {cnae.simples_nacional.aliquota_estimada}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Descrição Detalhada - "Esta atividade compreende" */}
                        {cnae.descricao_detalhada && (
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <p className="text-sm font-bold mb-2" style={{ color: colors.primary }}>
                              📝 Esta atividade compreende:
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                              {cnae.descricao_detalhada}
                            </p>
                          </div>
                        )}
                        
                        {/* Lista de Atividades */}
                        {cnae.lista_atividades && cnae.lista_atividades.length > 0 && (
                          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                            <p className="text-sm font-bold mb-2" style={{ color: colors.primary }}>
                              📋 Lista de Atividades:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1" style={{ color: colors.text }}>
                              {cnae.lista_atividades.map((atividade, idx) => (
                                <li key={idx} className="ml-2">{atividade}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Atividades Compreendidas */}
                        {cnae.atividades_compreendidas && cnae.atividades_compreendidas.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                              Atividades Compreendidas:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1" style={{ color: colors.text }}>
                              {cnae.atividades_compreendidas.map((atividade, idx) => (
                                <li key={idx}>{atividade}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Hierarquia (menos destaque) */}
                        <details className="text-xs" style={{ color: colors.textSecondary }}>
                          <summary className="cursor-pointer hover:underline">Ver hierarquia completa</summary>
                          <div className="mt-2 space-y-1 pl-4">
                            <div>
                              <strong>Seção:</strong> {cnae.secao.codigo} - {cnae.secao.descricao}
                            </div>
                            <div>
                              <strong>Divisão:</strong> {cnae.divisao.codigo} - {cnae.divisao.descricao}
                            </div>
                            <div>
                              <strong>Grupo:</strong> {cnae.grupo.codigo} - {cnae.grupo.descricao}
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado inicial */}
        {!termoBusca && !carregando && resultados.length === 0 && (
          <div className="text-center py-12">
            <Search size={64} style={{ color: colors.textSecondary }} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              Busque por CNAE
            </h3>
            <p style={{ color: colors.textSecondary }}>
              Digite um código ou parte da descrição da atividade econômica
            </p>
            <div className="mt-6 max-w-md mx-auto text-left">
              <p className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                Exemplos de busca:
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>• <strong>6920</strong> - Busca por código</li>
                <li>• <strong>contabilidade</strong> - Busca por descrição</li>
                <li>• <strong>restaurante</strong> - Busca por palavra-chave</li>
                <li>• <strong>69.20-6/01</strong> - Busca por código formatado</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ConsultaCNAE;

