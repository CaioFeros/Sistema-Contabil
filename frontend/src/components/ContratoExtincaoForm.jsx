import React, { useState, useEffect } from 'react';
import { Building2, DollarSign, Calendar, User, FileText } from 'lucide-react';
import { getClientes, getClienteById } from '../services/clienteApi';
import { listarSocios } from '../services/socioService';

/**
 * Formulário específico para Contrato de Extinção
 * Usado para extinção de empresas já cadastradas (PJ)
 */
const ContratoExtincaoForm = ({ tipoExtincao, onDadosPreenchidos, dadosIniciais = {} }) => {
  const [carregando, setCarregando] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [socios, setSocios] = useState([]);
  
  // Motivos de extinção pré-definidos
  const motivosExtincao = [
    'Extinção, pelo encerramento da liquidação voluntária',
    'Incorporação',
    'Fusão',
    'Cisão Total',
    'Encerramento do processo de falência',
    'Encerramento do processo de liquidação extrajudicial',
    'Extinção, por unificação da inscrição da filial',
    'Transformação do órgão regional à condição de matriz',
    'Transformação do órgão local à condição de filial do órgão regional'
  ];

  // Dados do formulário
  const [formData, setFormData] = useState({
    empresa_id: dadosIniciais.empresa_id || null,
    data_balanco: dadosIniciais.data_balanco || new Date().toISOString().split('T')[0],
    data_encerramento: dadosIniciais.data_encerramento || new Date().toISOString().split('T')[0],
    responsavel_documentacao: dadosIniciais.responsavel_documentacao || '',
    motivo_extincao: dadosIniciais.motivo_extincao || motivosExtincao[0]
  });

  const [erros, setErros] = useState({});

  useEffect(() => {
    carregarEmpresas();
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      console.log('Empresa selecionada:', empresaSelecionada);
      console.log('Capital Social:', empresaSelecionada.capital_social);
      console.log('Endereço:', {
        logradouro: empresaSelecionada.logradouro,
        numero: empresaSelecionada.numero,
        municipio: empresaSelecionada.municipio
      });
      carregarSocios(empresaSelecionada.id);
      preencherDadosEmpresa(empresaSelecionada);
    }
  }, [empresaSelecionada]);

  useEffect(() => {
    if (onDadosPreenchidos) {
      onDadosPreenchidos({
        ...formData,
        empresa: empresaSelecionada,
        socios: socios
      });
    }
  }, [formData, empresaSelecionada, socios]);

  const carregarEmpresas = async () => {
    try {
      setCarregando(true);
      const dados = await getClientes();
      // Filtra apenas PJ
      const empresasPJ = dados.filter(c => c.tipo_pessoa === 'PJ');
      setEmpresas(empresasPJ);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setEmpresas([]);
    } finally {
      setCarregando(false);
    }
  };

  const carregarSocios = async (empresaId) => {
    try {
      // Busca sócios com dados completos (RG, endereço, estado civil)
      const dados = await listarSocios(empresaId, true);
      setSocios(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar sócios:', error);
      setSocios([]);
    }
  };

  const carregarDadosCompletosEmpresa = async (empresaId) => {
    try {
      const empresaCompleta = await getClienteById(empresaId);
      console.log('✅ Dados completos da empresa carregados:', empresaCompleta);
      setEmpresaSelecionada(empresaCompleta);
    } catch (error) {
      console.error('Erro ao carregar dados completos da empresa:', error);
    }
  };

  const preencherDadosEmpresa = (empresa) => {
    // Para empresário individual, sempre o único sócio é responsável
    const responsavel = socios.length > 0 ? socios[0].socio_nome : '';
    
    setFormData(prev => ({
      ...prev,
      empresa_id: empresa.id,
      responsavel_documentacao: responsavel
    }));
  };

  const isUnipessoal = tipoExtincao === 'extincao_unipessoal';
  const isIndividual = tipoExtincao === 'extincao_individual';
  
  // Atualiza responsável automaticamente quando sócios são carregados
  useEffect(() => {
    if (socios.length > 0 && (isUnipessoal || isIndividual)) {
      setFormData(prev => ({
        ...prev,
        responsavel_documentacao: socios[0].socio_nome
      }));
    }
  }, [socios, isUnipessoal, isIndividual]);

  return (
    <div className="space-y-6">
      {/* Seleção de Empresa */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          {isUnipessoal ? 'Sociedade a ser Extinta' : 'Empresa a ser Extinta'}
        </h4>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecione a Empresa <span className="text-red-500">*</span>
          </label>
          <select
            value={empresaSelecionada?.id || ''}
            onChange={(e) => {
              const empresaId = parseInt(e.target.value);
              if (empresaId) {
                carregarDadosCompletosEmpresa(empresaId);
              } else {
                setEmpresaSelecionada(null);
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
              erros.empresa ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Selecione uma empresa...</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.razao_social} - {empresa.cnpj}
              </option>
            ))}
          </select>
          {erros.empresa && <p className="mt-1 text-sm text-red-600">{erros.empresa}</p>}
        </div>

        {/* Informações da Empresa Selecionada */}
        {empresaSelecionada && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
              {empresaSelecionada.razao_social}
            </h5>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div><strong>CNPJ:</strong> {empresaSelecionada.cnpj || 'N/A'}</div>
              <div>
                <strong>Capital Social:</strong> {(() => {
                  const valor = empresaSelecionada.capital_social;
                  console.log('Capital Social raw:', valor, 'tipo:', typeof valor);
                  
                  // Se não existe ou é explicitamente 'null' como string
                  if (valor === null || valor === undefined || valor === 'null' || valor === '') {
                    return <span className="text-red-600">⚠️ Não cadastrado</span>;
                  }
                  
                  // Se é string e já está formatado (ex: "5.000,00")
                  if (typeof valor === 'string' && (valor.includes(',') || valor.includes('.'))) {
                    return `R$ ${valor}`;
                  }
                  
                  // Tenta converter para número
                  const valorString = valor.toString();
                  const numero = parseFloat(valorString.replace(/\./g, '').replace(',', '.'));
                  
                  if (isNaN(numero) || numero === 0) {
                    return <span className="text-red-600">⚠️ Não cadastrado</span>;
                  }
                  
                  return `R$ ${numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
              </div>
              <div className="col-span-2">
                <strong>Endereço:</strong> {(() => {
                  const partes = [
                    empresaSelecionada.logradouro,
                    empresaSelecionada.numero,
                    empresaSelecionada.complemento,
                    empresaSelecionada.bairro,
                    empresaSelecionada.municipio,
                    empresaSelecionada.uf,
                    empresaSelecionada.cep
                  ].filter(p => p && typeof p === 'string' && p.trim() !== '');
                  
                  console.log('Partes do endereço:', partes);
                  console.log('Endereço raw:', {
                    logradouro: empresaSelecionada.logradouro,
                    numero: empresaSelecionada.numero,
                    municipio: empresaSelecionada.municipio,
                    uf: empresaSelecionada.uf
                  });
                  
                  if (partes.length === 0) {
                    return <span className="text-red-600">⚠️ Endereço não cadastrado</span>;
                  }
                  return partes.join(', ');
                })()}
              </div>
              {empresaSelecionada.data_abertura && (
                <div className="col-span-2"><strong>Data de Abertura:</strong> {new Date(empresaSelecionada.data_abertura).toLocaleDateString('pt-BR')}</div>
              )}
            </div>
            
            {/* Sócios */}
            {socios.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {isUnipessoal ? 'Sócio:' : 'Sócios:'}
                </p>
                <div className="space-y-1">
                  {socios.map((socio, idx) => (
                    <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                      • {socio.socio_nome} - CPF: {socio.socio_cpf} ({socio.percentual_participacao}%)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dados da Extinção */}
      {empresaSelecionada && (
        <>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Dados da Extinção
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data do Balanço de Liquidação <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.data_balanco}
                  onChange={(e) => setFormData({ ...formData, data_balanco: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Encerramento das Atividades <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.data_encerramento}
                  onChange={(e) => setFormData({ ...formData, data_encerramento: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo da Extinção <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.motivo_extincao}
                  onChange={(e) => setFormData({ ...formData, motivo_extincao: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {motivosExtincao.map((motivo, index) => (
                    <option key={index} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Responsável pela Documentação - Só para Distrato (múltiplos sócios) */}
          {!isUnipessoal && !isIndividual && socios.length > 1 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Guarda de Documentação
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Responsável pela Guarda dos Documentos
                </label>
                <select
                  value={formData.responsavel_documentacao}
                  onChange={(e) => setFormData({ ...formData, responsavel_documentacao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione um sócio...</option>
                  {socios.map((socio, idx) => (
                    <option key={idx} value={socio.socio_nome}>
                      {socio.socio_nome} - {socio.percentual_participacao}%
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <h5 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
              ⚠️ Resumo da Extinção
            </h5>
            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <p><strong>Empresa:</strong> {empresaSelecionada.razao_social}</p>
              <p><strong>CNPJ:</strong> {empresaSelecionada.cnpj}</p>
              <p>
                <strong>Valor de Liquidação:</strong> R$ {(() => {
                  const valor = empresaSelecionada.capital_social;
                  if (!valor) return '0,00';
                  if (typeof valor === 'string' && valor.includes(',')) return valor;
                  const numero = parseFloat(valor.toString().replace('.', '').replace(',', '.') || 0);
                  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}
              </p>
              {!isUnipessoal && (
                <p><strong>Responsável:</strong> {formData.responsavel_documentacao || 'Não definido'}</p>
              )}
              <p><strong>Data de Encerramento:</strong> {formData.data_encerramento ? new Date(formData.data_encerramento).toLocaleDateString('pt-BR') : 'Não definida'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContratoExtincaoForm;

