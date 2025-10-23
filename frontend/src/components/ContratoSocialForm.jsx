import React, { useState, useEffect, useCallback } from 'react';
import { Building2, MapPin, DollarSign, FileText, User, Plus, X, Search } from 'lucide-react';
import { listarClientesPF } from '../services/clientePFService';
import { buscarCNAE } from '../services/cnaeService';

/**
 * Formulário específico para Contrato Social
 * Usado para constituir novas empresas a partir de pessoas físicas
 */
const ContratoSocialForm = ({ onDadosPreenchidos, dadosIniciais = {} }) => {
  const [carregando, setCarregando] = useState(false);
  const [pessoasFisicas, setPessoasFisicas] = useState([]);
  
  // Busca de CNAE
  const [cnaesPesquisa, setCnaesPesquisa] = useState('');
  const [cnaesResultados, setCnaesResultados] = useState([]);
  const [buscandoCnaes, setBuscandoCnaes] = useState(false);
  const [timeoutCnae, setTimeoutCnae] = useState(null);
  const [mostrarResultadosCnae, setMostrarResultadosCnae] = useState(false);
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    socios: dadosIniciais.socios || [],
    razao_social: dadosIniciais.razao_social || '',
    nome_fantasia: dadosIniciais.nome_fantasia || '',
    capital_social: dadosIniciais.capital_social || '',
    cnae_principal: dadosIniciais.cnae_principal || null,
    cnaes_secundarios: dadosIniciais.cnaes_secundarios || [],
    usar_endereco_socio: dadosIniciais.usar_endereco_socio || false,
    socio_endereco_ref: dadosIniciais.socio_endereco_ref || null,
    logradouro: dadosIniciais.logradouro || '',
    numero: dadosIniciais.numero || '',
    complemento: dadosIniciais.complemento || '',
    bairro: dadosIniciais.bairro || '',
    cep: dadosIniciais.cep || '',
    municipio: dadosIniciais.municipio || '',
    uf: dadosIniciais.uf || ''
  });

  const [erros, setErros] = useState({});

  useEffect(() => {
    carregarPessoasFisicas();
  }, []);

  useEffect(() => {
    if (onDadosPreenchidos) {
      onDadosPreenchidos(formData);
    }
  }, [formData]);

  // Busca CNAEs com debounce
  const realizarBuscaCnae = useCallback(async (termo) => {
    if (!termo || termo.length < 2) {
      setCnaesResultados([]);
      setMostrarResultadosCnae(false);
      return;
    }

    setBuscandoCnaes(true);
    try {
      const dados = await buscarCNAE(termo, 50);
      const resultadosArray = Array.isArray(dados.resultados) ? dados.resultados : [];
      setCnaesResultados(resultadosArray);
      setMostrarResultadosCnae(resultadosArray.length > 0);
    } catch (error) {
      console.error('Erro ao buscar CNAEs:', error);
      setCnaesResultados([]);
      setMostrarResultadosCnae(false);
    } finally {
      setBuscandoCnaes(false);
    }
  }, []);

  const handleBuscaCnaeChange = (e) => {
    const valor = e.target.value;
    setCnaesPesquisa(valor);

    if (timeoutCnae) {
      clearTimeout(timeoutCnae);
    }

    const novoTimeout = setTimeout(() => {
      realizarBuscaCnae(valor);
    }, 300);

    setTimeoutCnae(novoTimeout);
  };

  useEffect(() => {
    return () => {
      if (timeoutCnae) {
        clearTimeout(timeoutCnae);
      }
    };
  }, [timeoutCnae]);

  const carregarPessoasFisicas = async () => {
    try {
      setCarregando(true);
      const dados = await listarClientesPF();
      setPessoasFisicas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar pessoas físicas:', error);
      setPessoasFisicas([]);
    } finally {
      setCarregando(false);
    }
  };

  const montarEnderecoCompleto = (pessoa) => {
    const partes = [
      pessoa.logradouro,
      pessoa.numero,
      pessoa.complemento,
      pessoa.bairro,
      `${pessoa.municipio}-${pessoa.uf}`,
      `CEP ${pessoa.cep}`
    ].filter(p => p && p.trim() && p !== '-');
    
    return partes.join(', ');
  };

  const adicionarSocio = (pessoaFisica) => {
    if (formData.socios.some(s => s.id === pessoaFisica.id)) {
      alert('Esta pessoa já está na lista de sócios');
      return;
    }

    const novoSocio = {
      id: pessoaFisica.id,
      nome_completo: pessoaFisica.nome_completo,
      cpf: pessoaFisica.cpf,
      rg: pessoaFisica.rg || '',
      data_nascimento: pessoaFisica.data_nascimento || '',
      estado_civil: pessoaFisica.estado_civil || '',
      regime_comunhao: pessoaFisica.regime_comunhao || '',
      nacionalidade: 'Brasileira',
      endereco_completo: montarEnderecoCompleto(pessoaFisica),
      logradouro: pessoaFisica.logradouro || '',
      numero: pessoaFisica.numero || '',
      complemento: pessoaFisica.complemento || '',
      bairro: pessoaFisica.bairro || '',
      cep: pessoaFisica.cep || '',
      municipio: pessoaFisica.municipio || '',
      uf: pessoaFisica.uf || '',
      percentual_participacao: formData.socios.length === 0 ? '100' : '',
      cargo: 'Sócio Administrador',
      profissao: ''
    };

    setFormData({
      ...formData,
      socios: [...formData.socios, novoSocio]
    });
  };

  const removerSocio = (index) => {
    const novosSocios = formData.socios.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      socios: novosSocios,
      usar_endereco_socio: formData.socio_endereco_ref === index ? false : formData.usar_endereco_socio,
      socio_endereco_ref: formData.socio_endereco_ref === index ? null : formData.socio_endereco_ref
    });
  };

  const atualizarSocio = (index, campo, valor) => {
    const novosSocios = [...formData.socios];
    novosSocios[index][campo] = valor;
    setFormData({
      ...formData,
      socios: novosSocios
    });
  };

  const selecionarCnaePrincipal = (cnae) => {
    setFormData({
      ...formData,
      cnae_principal: cnae
    });
    setCnaesPesquisa('');
    setCnaesResultados([]);
    setMostrarResultadosCnae(false);
  };

  const adicionarCnaeSecundario = (cnae) => {
    if (formData.cnaes_secundarios.some(c => c.codigo === cnae.codigo)) {
      alert('Este CNAE já está na lista');
      return;
    }
    
    if (formData.cnae_principal && cnae.codigo === formData.cnae_principal.codigo) {
      alert('Este CNAE já é o principal');
      return;
    }

    setFormData({
      ...formData,
      cnaes_secundarios: [...formData.cnaes_secundarios, cnae]
    });
    setCnaesPesquisa('');
    setCnaesResultados([]);
    setMostrarResultadosCnae(false);
  };

  const removerCnaeSecundario = (codigo) => {
    setFormData({
      ...formData,
      cnaes_secundarios: formData.cnaes_secundarios.filter(c => c.codigo !== codigo)
    });
  };

  const usarEnderecoSocio = (index) => {
    const socio = formData.socios[index];
    setFormData({
      ...formData,
      usar_endereco_socio: true,
      socio_endereco_ref: index,
      logradouro: socio.logradouro,
      numero: socio.numero,
      complemento: socio.complemento,
      bairro: socio.bairro,
      cep: socio.cep,
      municipio: socio.municipio,
      uf: socio.uf
    });
  };

  const gerarObjetoSocial = () => {
    const atividades = [];
    
    if (formData.cnae_principal?.lista_atividades) {
      atividades.push(...formData.cnae_principal.lista_atividades);
    }
    
    formData.cnaes_secundarios.forEach(cnae => {
      if (cnae.lista_atividades) {
        atividades.push(...cnae.lista_atividades);
      }
    });
    
    return atividades.length > 0 ? atividades.join('; ') : '';
  };

  return (
    <div className="space-y-6">
      {/* Seção de Sócios */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Sócios da Empresa
        </h4>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Adicionar Sócio (Pessoa Física Cadastrada)
          </label>
          <div className="flex space-x-2">
            <select
              id="select-pessoa-fisica"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione uma pessoa física...</option>
              {pessoasFisicas.map((pf) => (
                <option key={pf.id} value={pf.id}>
                  {pf.nome_completo} - {pf.cpf}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const select = document.getElementById('select-pessoa-fisica');
                if (select.value) {
                  const pf = pessoasFisicas.find(p => p.id === parseInt(select.value));
                  if (pf) {
                    adicionarSocio(pf);
                    select.value = '';
                  }
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              title="Adicionar sócio"
            >
              <Plus className="h-5 w-5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        {erros.socios && <p className="text-sm text-red-600 mb-2">{erros.socios}</p>}
        {erros.percentuais && <p className="text-sm text-red-600 mb-2">{erros.percentuais}</p>}

        <div className="space-y-3">
          {formData.socios.map((socio, index) => (
            <div key={index} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-750">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white">{socio.nome_completo}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CPF: {socio.cpf}</p>
                  {socio.estado_civil && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {socio.estado_civil}{socio.estado_civil === 'casado' && socio.regime_comunhao && ` - ${socio.regime_comunhao}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removerSocio(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Percentual (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={socio.percentual_participacao}
                    onChange={(e) => atualizarSocio(index, 'percentual_participacao', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="50.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cargo
                  </label>
                  <select
                    value={socio.cargo}
                    onChange={(e) => atualizarSocio(index, 'cargo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Sócio">Sócio</option>
                    <option value="Sócio Administrador">Sócio Administrador</option>
                    <option value="Sócio Gerente">Sócio Gerente</option>
                    <option value="Diretor">Diretor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profissão
                  </label>
                  <input
                    type="text"
                    value={socio.profissao}
                    onChange={(e) => atualizarSocio(index, 'profissao', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Contador"
                  />
                </div>
              </div>
            </div>
          ))}
          
          {formData.socios.length === 0 && (
            <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum sócio adicionado. Selecione acima para adicionar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dados da Empresa */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Dados da Empresa
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Razão Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.razao_social}
              onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                erros.razao_social ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Ex: EMPRESA ABC LTDA"
            />
            {erros.razao_social && <p className="mt-1 text-sm text-red-600">{erros.razao_social}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome Fantasia (Opcional)
            </label>
            <input
              type="text"
              value={formData.nome_fantasia}
              onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: ABC Store"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capital Social (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.capital_social}
              onChange={(e) => setFormData({ ...formData, capital_social: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                erros.capital_social ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="5000.00"
            />
            {erros.capital_social && <p className="mt-1 text-sm text-red-600">{erros.capital_social}</p>}
          </div>
        </div>
      </div>

      {/* CNAEs */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Atividades Econômicas (CNAE)
        </h4>

        {/* Lista de CNAEs Selecionados */}
        {(formData.cnae_principal || formData.cnaes_secundarios.length > 0) && (
          <div className="mb-4 space-y-2">
            {formData.cnae_principal && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                        PRINCIPAL
                      </span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formData.cnae_principal.codigo} - {formData.cnae_principal.descricao}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, cnae_principal: null })}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {formData.cnae_principal.lista_atividades && formData.cnae_principal.lista_atividades.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Atividades:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {formData.cnae_principal.lista_atividades.map((atividade, idx) => (
                        <li key={idx}>• {atividade}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {formData.cnaes_secundarios.map((cnae) => (
              <div key={cnae.codigo} className="p-4 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded">
                        SECUNDÁRIO
                      </span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {cnae.codigo} - {cnae.descricao}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removerCnaeSecundario(cnae.codigo)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {cnae.lista_atividades && cnae.lista_atividades.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Atividades:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {cnae.lista_atividades.map((atividade, idx) => (
                        <li key={idx}>• {atividade}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Campo de Busca Unificado */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {formData.cnae_principal ? 'Adicionar Mais CNAEs (Opcional)' : 'Buscar CNAEs'} <span className="text-red-500">*</span>
          </label>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={cnaesPesquisa}
              onChange={handleBuscaCnaeChange}
              onFocus={() => cnaesPesquisa.length >= 2 && setMostrarResultadosCnae(true)}
              placeholder={formData.cnae_principal ? "Buscar e adicionar mais CNAEs..." : "Digite código ou descrição do CNAE..."}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                erros.cnae_principal ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            
            {buscandoCnaes && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Resultados da Busca */}
          {mostrarResultadosCnae && cnaesResultados.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-600 rounded-lg shadow-xl max-h-96 overflow-y-auto">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-700">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
                  {cnaesResultados.length} resultado(s) - Clique para adicionar
                </p>
              </div>
              {cnaesResultados.map((cnae) => (
                <button
                  key={cnae.codigo}
                  onClick={() => {
                    if (!formData.cnae_principal) {
                      selecionarCnaePrincipal(cnae);
                    } else {
                      adicionarCnaeSecundario(cnae);
                    }
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {cnae.codigo} - {cnae.descricao}
                      </p>
                      {cnae.grupo && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Grupo: {cnae.grupo.descricao}
                        </p>
                      )}
                      {cnae.lista_atividades && cnae.lista_atividades.length > 0 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          📋 {cnae.lista_atividades.length} atividade(s)
                        </p>
                      )}
                    </div>
                    <Plus className="h-6 w-6 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {erros.cnae_principal && !formData.cnae_principal && (
            <p className="mt-1 text-sm text-red-600">{erros.cnae_principal}</p>
          )}
          
          {!formData.cnae_principal && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              💡 O primeiro CNAE adicionado será o Principal
            </p>
          )}
        </div>

        {/* Preview do Objeto Social */}
        {(formData.cnae_principal || formData.cnaes_secundarios.length > 0) && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              📋 Objeto Social (gerado automaticamente das atividades):
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {gerarObjetoSocial() || 'Nenhuma atividade definida'}
            </p>
          </div>
        )}
      </div>

      {/* Endereço */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Endereço da Empresa
        </h4>

        {formData.socios.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              💡 Usar endereço de um sócio?
            </p>
            <div className="flex flex-wrap gap-2">
              {formData.socios.map((socio, index) => (
                <button
                  key={index}
                  onClick={() => usarEnderecoSocio(index)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    formData.usar_endereco_socio && formData.socio_endereco_ref === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {socio.nome_completo}
                </button>
              ))}
              {formData.usar_endereco_socio && (
                <button
                  onClick={() => setFormData({ ...formData, usar_endereco_socio: false, socio_endereco_ref: null })}
                  className="px-4 py-2 rounded-lg text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Preencher Manualmente
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CEP</label>
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
              disabled={formData.usar_endereco_socio}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logradouro</label>
            <input
              type="text"
              value={formData.logradouro}
              onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
              disabled={formData.usar_endereco_socio}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Número</label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              disabled={formData.usar_endereco_socio}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Complemento</label>
            <input
              type="text"
              value={formData.complemento}
              onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
              disabled={formData.usar_endereco_socio}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bairro</label>
            <input
              type="text"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              disabled={formData.usar_endereco_socio}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Município</label>
            <input
              type="text"
              value={formData.municipio}
              onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
              disabled={formData.usar_endereco_socio}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">UF</label>
            <input
              type="text"
              value={formData.uf}
              onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
              maxLength={2}
              disabled={formData.usar_endereco_socio}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContratoSocialForm;
