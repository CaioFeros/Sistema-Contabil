import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, User, MapPin, Phone, Mail, DollarSign } from 'lucide-react';
import { cadastrarClientePF, validarCPF, formatarCPF, formatarCEP, formatarTelefone } from '../services/clientePFService';
import { consultarCep } from '../services/cepService';

/**
 * Modal para cadastrar cliente pessoa física manualmente
 */
const CadastroClientePFModal = ({ onCadastrado, onCancelar }) => {
  const [cadastrando, setCadastrando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    estado_civil: '',
    regime_comunhao: '',
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: '',
    uf: '',
    // Contato
    telefone1: '',
    telefone2: '',
    email: '',
    // Honorários
    valor_honorarios: ''
  });

  const [errosCampos, setErrosCampos] = useState({});

  // Valida CPF em tempo real
  const handleCpfChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    const cpfFormatado = formatarCPF(valor);
    
    setFormData({ ...formData, cpf: cpfFormatado });
    
    // Valida CPF se tiver 11 dígitos
    if (valor.length === 11) {
      if (!validarCPF(valor)) {
        setErrosCampos({ ...errosCampos, cpf: 'CPF inválido' });
      } else {
        const { cpf, ...restErros } = errosCampos;
        setErrosCampos(restErros);
      }
    }
  };

  // Busca CEP automaticamente
  const handleCepChange = async (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    const cepFormatado = formatarCEP(valor);
    
    setFormData({ ...formData, cep: cepFormatado });
    
    // Busca automaticamente quando tiver 8 dígitos
    if (valor.length === 8) {
      setBuscandoCep(true);
      try {
        const dadosCep = await consultarCep(valor);
        
        setFormData({
          ...formData,
          cep: cepFormatado,
          logradouro: dadosCep.logradouro || '',
          bairro: dadosCep.bairro || '',
          municipio: dadosCep.municipio || '',
          uf: dadosCep.uf || '',
          complemento: dadosCep.complemento || formData.complemento
        });
        
        const { cep: cepErro, ...restErros } = errosCampos;
        setErrosCampos(restErros);
      } catch (error) {
        setErrosCampos({ ...errosCampos, cep: 'CEP não encontrado' });
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  // Formata telefone em tempo real
  const handleTelefoneChange = (campo) => (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    const telFormatado = formatarTelefone(valor);
    setFormData({ ...formData, [campo]: telFormatado });
  };

  // Validação do formulário
  const validarFormulario = () => {
    const novosErros = {};

    // Campos obrigatórios
    if (!formData.nome_completo.trim()) {
      novosErros.nome_completo = 'Nome completo é obrigatório';
    }

    if (!formData.cpf) {
      novosErros.cpf = 'CPF é obrigatório';
    } else if (!validarCPF(formData.cpf)) {
      novosErros.cpf = 'CPF inválido';
    }

    // Validação de email (se fornecido)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      novosErros.email = 'Email inválido';
    }

    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      setErro('Por favor, corrija os erros no formulário');
      return;
    }

    setCadastrando(true);
    setErro(null);

    try {
      // Remove formatação dos campos antes de enviar
      const dadosLimpos = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        cep: formData.cep.replace(/\D/g, ''),
        telefone1: formData.telefone1.replace(/\D/g, ''),
        telefone2: formData.telefone2.replace(/\D/g, ''),
        valor_honorarios: formData.valor_honorarios ? parseFloat(formData.valor_honorarios) : null
      };

      const resultado = await cadastrarClientePF(dadosLimpos);
      
      setSucesso(true);
      
      // Aguarda 1.5 segundos para feedback visual
      setTimeout(() => {
        onCadastrado(resultado.cliente);
      }, 1500);
    } catch (error) {
      console.error('Erro ao cadastrar cliente PF:', error);
      
      // Mensagens de erro mais específicas
      let mensagemErro = 'Erro ao cadastrar cliente. Tente novamente.';
      
      if (error.response) {
        if (error.response.status === 409) {
          // CPF duplicado - mostra detalhes do cliente existente
          const dados = error.response.data;
          mensagemErro = dados?.erro || 'CPF já cadastrado no sistema.';
          if (dados?.detalhes) {
            mensagemErro += ` ${dados.detalhes}`;
          }
        } else if (error.response.data?.erro) {
          mensagemErro = error.response.data.erro;
        }
      } else if (error.request) {
        mensagemErro = 'Erro de conexão com o servidor. Verifique sua internet.';
      }
      
      setErro(mensagemErro);
      setCadastrando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6 my-8">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Cadastrar Cliente Pessoa Física
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preencha os dados do cliente
              </p>
            </div>
          </div>
          <button
            onClick={onCancelar}
            disabled={cadastrando}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensagem de Sucesso */}
        {sucesso && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-800 dark:text-green-200">
              Cliente cadastrado com sucesso!
            </p>
          </div>
        )}

        {/* Mensagem de Erro */}
        {erro && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{erro}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Dados Pessoais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errosCampos.nome_completo
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } dark:bg-gray-700 dark:text-white`}
                  placeholder="Nome completo do cliente"
                />
                {errosCampos.nome_completo && (
                  <p className="mt-1 text-sm text-red-600">{errosCampos.nome_completo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CPF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errosCampos.cpf
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } dark:bg-gray-700 dark:text-white`}
                  placeholder="000.000.000-00"
                />
                {errosCampos.cpf && (
                  <p className="mt-1 text-sm text-red-600">{errosCampos.cpf}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RG
                </label>
                <input
                  type="text"
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="00.000.000-0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado Civil
                </label>
                <select
                  value={formData.estado_civil}
                  onChange={(e) => {
                    const novoEstadoCivil = e.target.value;
                    setFormData({ 
                      ...formData, 
                      estado_civil: novoEstadoCivil,
                      // Limpa o regime de comunhão se não for casado
                      regime_comunhao: novoEstadoCivil === 'casado' ? formData.regime_comunhao : ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  <option value="solteiro">Solteiro(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viuvo">Viúvo(a)</option>
                </select>
              </div>

              {formData.estado_civil === 'casado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Regime de Comunhão
                  </label>
                  <select
                    value={formData.regime_comunhao}
                    onChange={(e) => setFormData({ ...formData, regime_comunhao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="comunhao_parcial">Comunhão Parcial de Bens</option>
                    <option value="comunhao_universal">Comunhão Universal de Bens</option>
                    <option value="separacao_total">Separação Total de Bens</option>
                    <option value="separacao_obrigatoria">Separação Obrigatória de Bens</option>
                    <option value="participacao_final">Participação Final nos Aquestos</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Endereço
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CEP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={handleCepChange}
                    maxLength={9}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errosCampos.cep
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="00000-000"
                  />
                  {buscandoCep && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {errosCampos.cep && (
                  <p className="mt-1 text-sm text-red-600">{errosCampos.cep}</p>
                )}
              </div>

              <div className="lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logradouro
                </label>
                <input
                  type="text"
                  value={formData.logradouro}
                  onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="123"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Bairro"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Município
                </label>
                <input
                  type="text"
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="SP"
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Contato
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone Principal
                </label>
                <input
                  type="text"
                  value={formData.telefone1}
                  onChange={handleTelefoneChange('telefone1')}
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone Secundário
                </label>
                <input
                  type="text"
                  value={formData.telefone2}
                  onChange={handleTelefoneChange('telefone2')}
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errosCampos.email
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } dark:bg-gray-700 dark:text-white`}
                  placeholder="email@exemplo.com"
                />
                {errosCampos.email && (
                  <p className="mt-1 text-sm text-red-600">{errosCampos.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Honorários */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Honorários
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_honorarios}
                  onChange={(e) => setFormData({ ...formData, valor_honorarios: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancelar}
              disabled={cadastrando}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cadastrando || sucesso}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {cadastrando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Cadastrando...</span>
                </>
              ) : sucesso ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Cadastrado!</span>
                </>
              ) : (
                <span>Cadastrar Cliente</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroClientePFModal;

