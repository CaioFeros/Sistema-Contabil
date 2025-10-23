import React, { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, Briefcase, MapPin, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { getClientes, getClienteById } from '../services/clienteApi';
import { buscarSociosPorCliente } from '../services/socioService';
import { buscarCNAE } from '../services/cnaeService';

/**
 * Formulário para Contrato de Alteração Contratual com 3 sub-passos:
 * 1. Selecionar empresa
 * 2. Selecionar tipos de alterações (múltipla escolha)
 * 3. Preencher dados específicos de cada alteração selecionada
 */
const ContratoAlteracaoForm = ({ onDadosPreenchidos }) => {
  const [subPasso, setSubPasso] = useState(1);
  
  // SUB-PASSO 1: Selecionar Empresa
  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [buscaEmpresa, setBuscaEmpresa] = useState('');
  
  // SUB-PASSO 2: Selecionar Tipos de Alterações
  const [tiposAlteracaoSelecionados, setTiposAlteracaoSelecionados] = useState({
    quadro_societario: false,
    capital_social: false,
    quadro_atividades: false,
    endereco: false
  });
  
  // SUB-PASSO 3: Dados específicos de cada alteração
  const [dadosQuadroSocietario, setDadosQuadroSocietario] = useState({
    sociosAtuais: [],
    alteracoes: [] // { tipo: 'adicionar'|'remover'|'alterar', socio_id: null, dados: {} }
  });
  
  const [dadosCapitalSocial, setDadosCapitalSocial] = useState({
    capital_atual: '',
    capital_novo: '',
    forma_integralizacao: 'dinheiro',
    justificativa: ''
  });
  
  const [dadosQuadroAtividades, setDadosQuadroAtividades] = useState({
    cnaes_atuais: [],
    cnae_principal_novo: null,
    cnaes_adicionar: [],
    cnaes_remover: []
  });
  
  const [dadosEndereco, setDadosEndereco] = useState({
    endereco_atual: {},
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: '',
    uf: '',
    cep: ''
  });
  
  // Estados auxiliares
  const [erro, setErro] = useState(null);
  const [carregandoSocios, setCarregandoSocios] = useState(false);
  const [buscaCNAE, setBuscaCNAE] = useState('');
  const [resultadosCNAE, setResultadosCNAE] = useState([]);
  const [carregandoCNAE, setCarregandoCNAE] = useState(false);

  // Carrega clientes ao montar
  useEffect(() => {
    carregarClientes();
  }, []);

  // Carrega sócios quando empresa é selecionada
  useEffect(() => {
    if (empresaSelecionada && tiposAlteracaoSelecionados.quadro_societario) {
      carregarSociosEmpresa();
    }
  }, [empresaSelecionada, tiposAlteracaoSelecionados.quadro_societario]);

  // Carrega CNAEs quando empresa é selecionada
  useEffect(() => {
    if (empresaSelecionada && tiposAlteracaoSelecionados.quadro_atividades) {
      carregarCNAEsEmpresa();
    }
  }, [empresaSelecionada, tiposAlteracaoSelecionados.quadro_atividades]);

  // Carrega endereço quando empresa é selecionada
  useEffect(() => {
    if (empresaSelecionada && tiposAlteracaoSelecionados.endereco) {
      setDadosEndereco(prev => ({
        ...prev,
        endereco_atual: {
          logradouro: empresaSelecionada.logradouro || '',
          numero: empresaSelecionada.numero || '',
          complemento: empresaSelecionada.complemento || '',
          bairro: empresaSelecionada.bairro || '',
          municipio: empresaSelecionada.municipio || '',
          uf: empresaSelecionada.uf || '',
          cep: empresaSelecionada.cep || ''
        },
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        municipio: '',
        uf: '',
        cep: ''
      }));
    }
  }, [empresaSelecionada, tiposAlteracaoSelecionados.endereco]);

  // Atualiza dados preenchidos
  useEffect(() => {
    if (empresaSelecionada && subPasso === 3) {
      onDadosPreenchidos({
        empresa: empresaSelecionada,
        tipos_alteracao: tiposAlteracaoSelecionados,
        quadro_societario: tiposAlteracaoSelecionados.quadro_societario ? dadosQuadroSocietario : null,
        capital_social: tiposAlteracaoSelecionados.capital_social ? dadosCapitalSocial : null,
        quadro_atividades: tiposAlteracaoSelecionados.quadro_atividades ? dadosQuadroAtividades : null,
        endereco: tiposAlteracaoSelecionados.endereco ? dadosEndereco : null
      });
    }
  }, [empresaSelecionada, subPasso, tiposAlteracaoSelecionados, dadosQuadroSocietario, dadosCapitalSocial, dadosQuadroAtividades, dadosEndereco]);

  const carregarClientes = async () => {
    try {
      setCarregandoClientes(true);
      const dados = await getClientes();
      // Filtra apenas empresas ativas (PJ)
      const empresas = dados.filter(c => c.tipo_pessoa === 'PJ');
      setClientes(empresas);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setErro('Erro ao carregar lista de empresas');
    } finally {
      setCarregandoClientes(false);
    }
  };

  const carregarSociosEmpresa = async () => {
    try {
      setCarregandoSocios(true);
      // Busca sócios com dados completos (true = inclui RG, endereço, etc)
      const socios = await buscarSociosPorCliente(empresaSelecionada.id, true);
      console.log('✅ Sócios carregados com dados completos:', socios);
      setDadosQuadroSocietario(prev => ({
        ...prev,
        sociosAtuais: Array.isArray(socios) ? socios : []
      }));
    } catch (error) {
      console.error('Erro ao carregar sócios:', error);
      setErro('Erro ao carregar sócios da empresa');
      setDadosQuadroSocietario(prev => ({
        ...prev,
        sociosAtuais: []
      }));
    } finally {
      setCarregandoSocios(false);
    }
  };

  const carregarCNAEsEmpresa = () => {
    try {
      const cnaes = [];
      
      // CNAE Principal
      if (empresaSelecionada.cnae_principal) {
        cnaes.push({
          codigo: empresaSelecionada.cnae_principal,
          principal: true
        });
      }
      
      // CNAEs Secundários
      if (empresaSelecionada.cnae_secundarias) {
        const secundarios = typeof empresaSelecionada.cnae_secundarias === 'string'
          ? JSON.parse(empresaSelecionada.cnae_secundarias)
          : empresaSelecionada.cnae_secundarias;
        
        secundarios.forEach(cnae => {
          cnaes.push({
            codigo: cnae,
            principal: false
          });
        });
      }
      
      setDadosQuadroAtividades(prev => ({
        ...prev,
        cnaes_atuais: cnaes
      }));
    } catch (error) {
      console.error('Erro ao carregar CNAEs:', error);
      setErro('Erro ao carregar CNAEs da empresa');
    }
  };

  const handleSelecionarEmpresa = async (cliente) => {
    try {
      // Busca dados completos da empresa (capital social, endereço completo, sócios, etc)
      console.log('Buscando dados completos da empresa ID:', cliente.id);
      const empresaCompleta = await getClienteById(cliente.id);
      console.log('✅ Dados completos da empresa carregados:', empresaCompleta);
      
      setEmpresaSelecionada(empresaCompleta);
      
      // Pré-preenche capital social se houver
      if (empresaCompleta.capital_social) {
        const capitalFormatado = typeof empresaCompleta.capital_social === 'string' 
          ? empresaCompleta.capital_social 
          : empresaCompleta.capital_social.toString();
          
        setDadosCapitalSocial(prev => ({
          ...prev,
          capital_atual: capitalFormatado
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar dados completos da empresa:', error);
      // Fallback para dados básicos
      setEmpresaSelecionada(cliente);
    }
  };

  const handleToggleTipoAlteracao = (tipo) => {
    setTiposAlteracaoSelecionados(prev => ({
      ...prev,
      [tipo]: !prev[tipo]
    }));
  };

  const handleProximoSubPasso = () => {
    if (subPasso === 1 && !empresaSelecionada) {
      setErro('Selecione uma empresa');
      return;
    }
    
    if (subPasso === 2) {
      const algumSelecionado = Object.values(tiposAlteracaoSelecionados).some(v => v);
      if (!algumSelecionado) {
        setErro('Selecione pelo menos um tipo de alteração');
        return;
      }
    }
    
    setErro(null);
    setSubPasso(subPasso + 1);
  };

  const handleVoltarSubPasso = () => {
    setSubPasso(subPasso - 1);
    setErro(null);
  };

  const buscarCNAEDebounced = async (termo) => {
    if (!termo || termo.length < 3) {
      setResultadosCNAE([]);
      return;
    }
    
    try {
      setCarregandoCNAE(true);
      const resultados = await buscarCNAE(termo);
      setResultadosCNAE(resultados || []);
    } catch (error) {
      console.error('Erro ao buscar CNAE:', error);
    } finally {
      setCarregandoCNAE(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarCNAEDebounced(buscaCNAE);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [buscaCNAE]);

  const handleAdicionarCNAE = (cnae) => {
    setDadosQuadroAtividades(prev => ({
      ...prev,
      cnaes_adicionar: [...prev.cnaes_adicionar, cnae]
    }));
    setBuscaCNAE('');
    setResultadosCNAE([]);
  };

  const handleRemoverCNAEDaLista = (cnae, lista) => {
    if (lista === 'adicionar') {
      setDadosQuadroAtividades(prev => ({
        ...prev,
        cnaes_adicionar: prev.cnaes_adicionar.filter(c => c.codigo !== cnae.codigo)
      }));
    } else if (lista === 'remover') {
      setDadosQuadroAtividades(prev => ({
        ...prev,
        cnaes_remover: prev.cnaes_remover.filter(c => c.codigo !== cnae.codigo)
      }));
    }
  };

  const handleMarcarCNAEParaRemover = (cnae) => {
    setDadosQuadroAtividades(prev => ({
      ...prev,
      cnaes_remover: [...prev.cnaes_remover, cnae]
    }));
  };

  const handleAdicionarAlteracaoSocio = () => {
    setDadosQuadroSocietario(prev => ({
      ...prev,
      alteracoes: [
        ...prev.alteracoes,
        {
          tipo: 'adicionar',
          socio_id: null,
          dados: {
            nome_completo: '',
            cpf: '',
            rg: '',
            percentual_participacao: '',
            endereco_completo: ''
          }
        }
      ]
    }));
  };

  const handleRemoverAlteracaoSocio = (index) => {
    setDadosQuadroSocietario(prev => ({
      ...prev,
      alteracoes: prev.alteracoes.filter((_, i) => i !== index)
    }));
  };

  const handleAtualizarAlteracaoSocio = (index, campo, valor) => {
    setDadosQuadroSocietario(prev => ({
      ...prev,
      alteracoes: prev.alteracoes.map((alt, i) => {
        if (i === index) {
          if (campo === 'tipo') {
            return { ...alt, tipo: valor };
          } else {
            return {
              ...alt,
              dados: { ...alt.dados, [campo]: valor }
            };
          }
        }
        return alt;
      })
    }));
  };

  const clientesFiltrados = clientes.filter(c =>
    c.razao_social?.toLowerCase().includes(buscaEmpresa.toLowerCase()) ||
    c.cnpj?.includes(buscaEmpresa)
  );

  return (
    <div className="space-y-6">
      {/* Indicador de Sub-Passos */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 flex-1">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${subPasso >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`h-1 flex-1 ${subPasso >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${subPasso >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
          <div className={`h-1 flex-1 ${subPasso >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${subPasso >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            3
          </div>
        </div>
      </div>

      {erro && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          <AlertCircle className="h-5 w-5" />
          <span>{erro}</span>
        </div>
      )}

      {/* SUB-PASSO 1: Selecionar Empresa */}
      {subPasso === 1 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Selecione a Empresa
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Escolha a empresa que terá o contrato de alteração
            </p>
          </div>

          {/* Busca */}
          <div>
            <input
              type="text"
              placeholder="Buscar por razão social ou CNPJ..."
              value={buscaEmpresa}
              onChange={(e) => setBuscaEmpresa(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Lista de Empresas */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {carregandoClientes ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Carregando empresas...
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Nenhuma empresa encontrada
              </div>
            ) : (
              clientesFiltrados.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => handleSelecionarEmpresa(cliente)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    empresaSelecionada?.id === cliente.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-white">
                        {cliente.razao_social}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        CNPJ: {cliente.cnpj}
                      </p>
                      {cliente.nome_fantasia && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Nome Fantasia: {cliente.nome_fantasia}
                        </p>
                      )}
                      {empresaSelecionada?.id === cliente.id && (
                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <strong>Capital Social:</strong> {empresaSelecionada.capital_social ? `R$ ${empresaSelecionada.capital_social}` : 'Não cadastrado'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <strong>Endereço:</strong> {[
                              empresaSelecionada.logradouro,
                              empresaSelecionada.numero,
                              empresaSelecionada.municipio,
                              empresaSelecionada.uf
                            ].filter(p => p).join(', ') || 'Não cadastrado'}
                          </p>
                        </div>
                      )}
                    </div>
                    {empresaSelecionada?.id === cliente.id && (
                      <div className="ml-4">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Botão Próximo */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleProximoSubPasso}
              disabled={!empresaSelecionada}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Próximo</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-PASSO 2: Selecionar Tipos de Alterações */}
      {subPasso === 2 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Selecione os Tipos de Alterações
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Marque todas as alterações que serão realizadas neste contrato
            </p>
          </div>

          {/* Opções de Alteração */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mudança de Quadro Societário */}
            <div
              onClick={() => handleToggleTipoAlteracao('quadro_societario')}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                tiposAlteracaoSelecionados.quadro_societario
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  tiposAlteracaoSelecionados.quadro_societario
                    ? 'bg-blue-100 dark:bg-blue-900/40'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Users className={`h-6 w-6 ${
                    tiposAlteracaoSelecionados.quadro_societario
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Mudança de Quadro Societário
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adicionar, remover ou alterar sócios
                  </p>
                </div>
                {tiposAlteracaoSelecionados.quadro_societario && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Alteração no Capital Social */}
            <div
              onClick={() => handleToggleTipoAlteracao('capital_social')}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                tiposAlteracaoSelecionados.capital_social
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  tiposAlteracaoSelecionados.capital_social
                    ? 'bg-blue-100 dark:bg-blue-900/40'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <DollarSign className={`h-6 w-6 ${
                    tiposAlteracaoSelecionados.capital_social
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Alteração no Capital Social
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aumentar ou reduzir o capital social
                  </p>
                </div>
                {tiposAlteracaoSelecionados.capital_social && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Alteração no Quadro de Atividades */}
            <div
              onClick={() => handleToggleTipoAlteracao('quadro_atividades')}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                tiposAlteracaoSelecionados.quadro_atividades
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  tiposAlteracaoSelecionados.quadro_atividades
                    ? 'bg-blue-100 dark:bg-blue-900/40'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Briefcase className={`h-6 w-6 ${
                    tiposAlteracaoSelecionados.quadro_atividades
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Alteração no Quadro de Atividades
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adicionar ou remover CNAEs
                  </p>
                </div>
                {tiposAlteracaoSelecionados.quadro_atividades && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Alteração de Endereço */}
            <div
              onClick={() => handleToggleTipoAlteracao('endereco')}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                tiposAlteracaoSelecionados.endereco
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  tiposAlteracaoSelecionados.endereco
                    ? 'bg-blue-100 dark:bg-blue-900/40'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <MapPin className={`h-6 w-6 ${
                    tiposAlteracaoSelecionados.endereco
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Alteração de Endereço
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mudar a sede da empresa
                  </p>
                </div>
                {tiposAlteracaoSelecionados.endereco && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botões de Navegação */}
          <div className="flex justify-between pt-4">
            <button
              onClick={handleVoltarSubPasso}
              className="flex items-center space-x-2 px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
            <button
              onClick={handleProximoSubPasso}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Próximo</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-PASSO 3: Preencher Dados Específicos */}
      {subPasso === 3 && (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Preencha os Dados das Alterações
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Informe os detalhes de cada alteração selecionada
            </p>
          </div>

          {/* Formulário: Mudança de Quadro Societário */}
          {tiposAlteracaoSelecionados.quadro_societario && (
            <div className="p-6 border border-gray-300 dark:border-gray-600 rounded-lg">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Mudança de Quadro Societário</span>
              </h5>

              {/* Sócios Atuais */}
              {dadosQuadroSocietario.sociosAtuais.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sócios Atuais:
                  </h6>
                  <div className="space-y-2">
                    {dadosQuadroSocietario.sociosAtuais.map((socio) => (
                      <div key={socio.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {socio.nome_completo}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          CPF: {socio.cpf} | Participação: {socio.percentual_participacao}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alterações */}
              <div className="space-y-4">
                {dadosQuadroSocietario.alteracoes.map((alteracao, index) => (
                  <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                        Alteração #{index + 1}
                      </h6>
                      <button
                        onClick={() => handleRemoverAlteracaoSocio(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tipo de Alteração
                        </label>
                        <select
                          value={alteracao.tipo}
                          onChange={(e) => handleAtualizarAlteracaoSocio(index, 'tipo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="adicionar">Adicionar Sócio</option>
                          <option value="remover">Remover Sócio</option>
                          <option value="alterar">Alterar Participação</option>
                        </select>
                      </div>

                      {alteracao.tipo === 'adicionar' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Nome Completo
                            </label>
                            <input
                              type="text"
                              value={alteracao.dados.nome_completo}
                              onChange={(e) => handleAtualizarAlteracaoSocio(index, 'nome_completo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                CPF
                              </label>
                              <input
                                type="text"
                                value={alteracao.dados.cpf}
                                onChange={(e) => handleAtualizarAlteracaoSocio(index, 'cpf', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                RG
                              </label>
                              <input
                                type="text"
                                value={alteracao.dados.rg}
                                onChange={(e) => handleAtualizarAlteracaoSocio(index, 'rg', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Percentual de Participação (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={alteracao.dados.percentual_participacao}
                              onChange={(e) => handleAtualizarAlteracaoSocio(index, 'percentual_participacao', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Endereço Completo
                            </label>
                            <input
                              type="text"
                              value={alteracao.dados.endereco_completo}
                              onChange={(e) => handleAtualizarAlteracaoSocio(index, 'endereco_completo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                          </div>
                        </>
                      )}

                      {alteracao.tipo === 'remover' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Selecionar Sócio a Remover
                          </label>
                          <select
                            value={alteracao.socio_id || ''}
                            onChange={(e) => handleAtualizarAlteracaoSocio(index, 'socio_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                          >
                            <option value="">Selecione...</option>
                            {dadosQuadroSocietario.sociosAtuais.map(socio => (
                              <option key={socio.id} value={socio.id}>
                                {socio.nome_completo} - {socio.cpf}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {alteracao.tipo === 'alterar' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Selecionar Sócio
                            </label>
                            <select
                              value={alteracao.socio_id || ''}
                              onChange={(e) => handleAtualizarAlteracaoSocio(index, 'socio_id', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            >
                              <option value="">Selecione...</option>
                              {dadosQuadroSocietario.sociosAtuais.map(socio => (
                                <option key={socio.id} value={socio.id}>
                                  {socio.nome_completo} - {socio.cpf}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Novo Percentual de Participação (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={alteracao.dados.percentual_participacao}
                              onChange={(e) => handleAtualizarAlteracaoSocio(index, 'percentual_participacao', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleAdicionarAlteracaoSocio}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  + Adicionar Alteração
                </button>
              </div>
            </div>
          )}

          {/* Formulário: Alteração no Capital Social */}
          {tiposAlteracaoSelecionados.capital_social && (
            <div className="p-6 border border-gray-300 dark:border-gray-600 rounded-lg">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span>Alteração no Capital Social</span>
              </h5>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capital Social Atual (R$)
                  </label>
                  <input
                    type="text"
                    value={dadosCapitalSocial.capital_atual}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Novo Capital Social (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dadosCapitalSocial.capital_novo}
                    onChange={(e) => setDadosCapitalSocial(prev => ({ ...prev, capital_novo: e.target.value }))}
                    placeholder="0,00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Forma de Integralização
                  </label>
                  <select
                    value={dadosCapitalSocial.forma_integralizacao}
                    onChange={(e) => setDadosCapitalSocial(prev => ({ ...prev, forma_integralizacao: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="bens">Bens</option>
                    <option value="misto">Misto (Dinheiro e Bens)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Justificativa da Alteração
                  </label>
                  <textarea
                    value={dadosCapitalSocial.justificativa}
                    onChange={(e) => setDadosCapitalSocial(prev => ({ ...prev, justificativa: e.target.value }))}
                    rows={3}
                    placeholder="Descreva o motivo da alteração do capital social..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Formulário: Alteração no Quadro de Atividades */}
          {tiposAlteracaoSelecionados.quadro_atividades && (
            <div className="p-6 border border-gray-300 dark:border-gray-600 rounded-lg">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span>Alteração no Quadro de Atividades</span>
              </h5>

              {/* CNAEs Atuais */}
              {dadosQuadroAtividades.cnaes_atuais.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CNAEs Atuais:
                  </h6>
                  <div className="space-y-2">
                    {dadosQuadroAtividades.cnaes_atuais.map((cnae, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {cnae.codigo} {cnae.principal && <span className="text-blue-600 font-semibold">(Principal)</span>}
                        </span>
                        <button
                          onClick={() => handleMarcarCNAEParaRemover(cnae)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Marcar para remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionar CNAEs */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adicionar CNAEs
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={buscaCNAE}
                    onChange={(e) => setBuscaCNAE(e.target.value)}
                    placeholder="Buscar CNAE por código ou descrição..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {carregandoCNAE && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {/* Resultados da Busca */}
                {resultadosCNAE.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                    {resultadosCNAE.map((cnae) => (
                      <div
                        key={cnae.id}
                        onClick={() => handleAdicionarCNAE(cnae)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {cnae.codigo}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {cnae.descricao}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CNAEs Selecionados para Adicionar */}
              {dadosQuadroAtividades.cnaes_adicionar.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CNAEs para Adicionar:
                  </h6>
                  <div className="space-y-2">
                    {dadosQuadroAtividades.cnaes_adicionar.map((cnae, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {cnae.codigo}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {cnae.descricao}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoverCNAEDaLista(cnae, 'adicionar')}
                          className="text-sm text-red-600 hover:text-red-700 ml-2"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CNAEs Marcados para Remover */}
              {dadosQuadroAtividades.cnaes_remover.length > 0 && (
                <div>
                  <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CNAEs para Remover:
                  </h6>
                  <div className="space-y-2">
                    {dadosQuadroAtividades.cnaes_remover.map((cnae, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {cnae.codigo}
                        </span>
                        <button
                          onClick={() => handleRemoverCNAEDaLista(cnae, 'remover')}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Cancelar remoção
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formulário: Alteração de Endereço */}
          {tiposAlteracaoSelecionados.endereco && (
            <div className="p-6 border border-gray-300 dark:border-gray-600 rounded-lg">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Alteração de Endereço</span>
              </h5>

              {/* Endereço Atual */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Endereço Atual:
                </h6>
                <p className="text-sm text-gray-900 dark:text-white">
                  {dadosEndereco.endereco_atual.logradouro}, {dadosEndereco.endereco_atual.numero}
                  {dadosEndereco.endereco_atual.complemento && `, ${dadosEndereco.endereco_atual.complemento}`}
                  <br />
                  {dadosEndereco.endereco_atual.bairro} - {dadosEndereco.endereco_atual.municipio}/{dadosEndereco.endereco_atual.uf}
                  <br />
                  CEP: {dadosEndereco.endereco_atual.cep}
                </p>
              </div>

              {/* Novo Endereço */}
              <div className="space-y-4">
                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Novo Endereço:
                </h6>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Logradouro <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dadosEndereco.logradouro}
                      onChange={(e) => setDadosEndereco(prev => ({ ...prev, logradouro: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Número <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dadosEndereco.numero}
                      onChange={(e) => setDadosEndereco(prev => ({ ...prev, numero: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={dadosEndereco.complemento}
                    onChange={(e) => setDadosEndereco(prev => ({ ...prev, complemento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bairro <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dadosEndereco.bairro}
                      onChange={(e) => setDadosEndereco(prev => ({ ...prev, bairro: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CEP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dadosEndereco.cep}
                      onChange={(e) => setDadosEndereco(prev => ({ ...prev, cep: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Município <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dadosEndereco.municipio}
                      onChange={(e) => setDadosEndereco(prev => ({ ...prev, municipio: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      UF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dadosEndereco.uf}
                      onChange={(e) => setDadosEndereco(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botão Voltar */}
          <div className="flex justify-start pt-4">
            <button
              onClick={handleVoltarSubPasso}
              className="flex items-center space-x-2 px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContratoAlteracaoForm;

