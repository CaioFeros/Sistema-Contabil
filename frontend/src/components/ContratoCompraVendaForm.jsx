import React, { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { listarClientesPF } from '../services/clientePFService';
import { getClientes, getClienteById } from '../services/clienteApi';

export default function ContratoCompraVendaForm({ onDadosPreenchidos }) {
  const [pessoasFisicas, setPessoasFisicas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  
  const [formData, setFormData] = useState({
    empresa_id: '',
    vendedor_id: '',
    compradores: [], // Array de IDs de CPFs
    valor_total_venda: '',
    forma_pagamento: 'a_vista', // 'a_vista' ou 'parcelado'
    numero_parcelas: 1,
    parcelas: [], // Array de {numero, valor, data_vencimento, banco, agencia, conta}
    dados_bancarios_vendedor: {
      banco: '',
      agencia: '',
      conta: ''
    },
    prazo_alteracao_razao: '180',
    data_contrato: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [pfs, pjs] = await Promise.all([
        listarClientesPF(),
        getClientes()
      ]);
      
      setPessoasFisicas(Array.isArray(pfs) ? pfs : []);
      setEmpresas(Array.isArray(pjs) ? pjs.filter(c => c.tipo_pessoa === 'PJ') : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const carregarDadosCompletosEmpresa = async (empresaId) => {
    try {
      const empresaCompleta = await getClienteById(empresaId);
      console.log('✅ Empresa completa (Compra/Venda):', empresaCompleta);
      // Atualiza o formData com o ID e também guarda a empresa completa para exibição
      setFormData(prev => ({ ...prev, empresa_id: empresaId }));
      // Armazena a empresa completa no estado local
      setEmpresas(prev => {
        const empresasAtualizadas = [...prev];
        const index = empresasAtualizadas.findIndex(e => e.id === empresaId);
        if (index !== -1) {
          empresasAtualizadas[index] = empresaCompleta;
        }
        return empresasAtualizadas;
      });
    } catch (error) {
      console.error('Erro ao carregar dados completos da empresa:', error);
    }
  };

  const adicionarComprador = () => {
    setFormData(prev => ({
      ...prev,
      compradores: [...prev.compradores, '']
    }));
  };

  const removerComprador = (index) => {
    setFormData(prev => ({
      ...prev,
      compradores: prev.compradores.filter((_, i) => i !== index)
    }));
  };

  const atualizarComprador = (index, valor) => {
    setFormData(prev => {
      const novosCompradores = [...prev.compradores];
      novosCompradores[index] = valor;
      return { ...prev, compradores: novosCompradores };
    });
  };

  const gerarParcelas = () => {
    const { valor_total_venda, numero_parcelas, dados_bancarios_vendedor } = formData;
    const valorTotal = parseFloat(valor_total_venda.replace(/\./g, '').replace(',', '.') || 0);
    const valorParcela = valorTotal / numero_parcelas;
    
    const parcelas = [];
    const hoje = new Date(formData.data_contrato);
    
    for (let i = 0; i < numero_parcelas; i++) {
      const dataVencimento = new Date(hoje);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);
      
      parcelas.push({
        numero: i + 1,
        valor: valorParcela.toFixed(2),
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        banco: dados_bancarios_vendedor.banco,
        agencia: dados_bancarios_vendedor.agencia,
        conta: dados_bancarios_vendedor.conta
      });
    }
    
    setFormData(prev => ({ ...prev, parcelas }));
  };

  const atualizarParcela = (index, campo, valor) => {
    setFormData(prev => {
      const novasParcelas = [...prev.parcelas];
      novasParcelas[index] = { ...novasParcelas[index], [campo]: valor };
      return { ...prev, parcelas: novasParcelas };
    });
  };

  useEffect(() => {
    if (onDadosPreenchidos) {
      // Prepara os dados para enviar ao wizard
      const empresaSelecionada = empresas.find(e => e.id === parseInt(formData.empresa_id));
      const vendedor = pessoasFisicas.find(pf => pf.id === parseInt(formData.vendedor_id));
      const compradores = formData.compradores
        .map(id => pessoasFisicas.find(pf => pf.id === parseInt(id)))
        .filter(Boolean);
      
      onDadosPreenchidos({
        ...formData,
        empresa: empresaSelecionada,
        vendedor,
        compradores
      });
    }
  }, [formData, empresas, pessoasFisicas, onDadosPreenchidos]);

  const empresaSelecionada = empresas.find(e => e.id === parseInt(formData.empresa_id));
  const vendedorSelecionado = pessoasFisicas.find(pf => pf.id === parseInt(formData.vendedor_id));

  return (
    <div className="space-y-6">
      {/* Seleção de Empresa */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Empresa a ser Vendida
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecione a Empresa (PJ)
          </label>
          <select
            value={formData.empresa_id}
            onChange={(e) => {
              const empresaId = parseInt(e.target.value);
              if (empresaId) {
                carregarDadosCompletosEmpresa(empresaId);
              } else {
                setFormData({ ...formData, empresa_id: '' });
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Selecione uma empresa...</option>
            {empresas.map(empresa => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.razao_social} - {empresa.cnpj}
              </option>
            ))}
          </select>
        </div>

        {empresaSelecionada && (
          <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
              {empresaSelecionada.razao_social}
            </h5>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div><strong>CNPJ:</strong> {empresaSelecionada.cnpj || 'N/A'}</div>
              <div>
                <strong>Capital Social:</strong> {(() => {
                  const valor = empresaSelecionada.capital_social;
                  
                  if (valor === null || valor === undefined || valor === 'null' || valor === '') {
                    return 'R$ 0,00';
                  }
                  
                  if (typeof valor === 'string' && (valor.includes(',') || valor.includes('.'))) {
                    return `R$ ${valor}`;
                  }
                  
                  const valorString = valor.toString();
                  const numero = parseFloat(valorString.replace(/\./g, '').replace(',', '.'));
                  
                  if (isNaN(numero)) {
                    return 'R$ 0,00';
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
                  
                  if (partes.length === 0) {
                    return 'Não cadastrado';
                  }
                  return partes.join(', ');
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vendedor */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Vendedor (Pessoa Física)
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecione o Vendedor
          </label>
          <select
            value={formData.vendedor_id}
            onChange={(e) => setFormData({ ...formData, vendedor_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Selecione um vendedor...</option>
            {pessoasFisicas.map(pf => (
              <option key={pf.id} value={pf.id}>
                {pf.nome_completo} - {pf.cpf}
              </option>
            ))}
          </select>
        </div>

        {vendedorSelecionado && (
          <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-gray-900 dark:text-white">
              <strong>Vendedor:</strong> {vendedorSelecionado.nome_completo}<br />
              <strong>CPF:</strong> {vendedorSelecionado.cpf}<br />
              <strong>RG:</strong> {vendedorSelecionado.rg || 'Não informado'}
            </p>
          </div>
        )}
      </div>

      {/* Compradores */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Compradores (Pessoa Física)
        </h4>

        {formData.compradores.map((compradorId, index) => (
          <div key={index} className="mb-3 flex gap-2">
            <select
              value={compradorId}
              onChange={(e) => atualizarComprador(index, e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Selecione um comprador...</option>
              {pessoasFisicas
                .filter(pf => pf.id !== parseInt(formData.vendedor_id))
                .map(pf => (
                  <option key={pf.id} value={pf.id}>
                    {pf.nome_completo} - {pf.cpf}
                  </option>
                ))}
            </select>
            {formData.compradores.length > 1 && (
              <button
                type="button"
                onClick={() => removerComprador(index)}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Remover
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={adicionarComprador}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Adicionar Comprador
        </button>

        {formData.compradores.length === 0 && (
          <div className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-900 dark:text-yellow-300 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Adicione pelo menos um comprador para continuar
            </p>
          </div>
        )}
      </div>

      {/* Valores e Pagamento */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Valores e Forma de Pagamento
        </h4>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor Total da Venda
            </label>
            <input
              type="text"
              value={formData.valor_total_venda}
              onChange={(e) => setFormData({ ...formData, valor_total_venda: e.target.value })}
              placeholder="15.000,00"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forma de Pagamento
            </label>
            <select
              value={formData.forma_pagamento}
              onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="a_vista">À Vista</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </div>
        </div>

        {/* Dados Bancários do Vendedor */}
        <div className="mb-4">
          <h5 className="font-medium text-gray-900 dark:text-white mb-3">Dados Bancários do Vendedor</h5>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Banco
              </label>
              <input
                type="text"
                value={formData.dados_bancarios_vendedor.banco}
                onChange={(e) => setFormData({
                  ...formData,
                  dados_bancarios_vendedor: { ...formData.dados_bancarios_vendedor, banco: e.target.value }
                })}
                placeholder="ITAU"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agência
              </label>
              <input
                type="text"
                value={formData.dados_bancarios_vendedor.agencia}
                onChange={(e) => setFormData({
                  ...formData,
                  dados_bancarios_vendedor: { ...formData.dados_bancarios_vendedor, agencia: e.target.value }
                })}
                placeholder="7151"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conta
              </label>
              <input
                type="text"
                value={formData.dados_bancarios_vendedor.conta}
                onChange={(e) => setFormData({
                  ...formData,
                  dados_bancarios_vendedor: { ...formData.dados_bancarios_vendedor, conta: e.target.value }
                })}
                placeholder="20747-4"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Parcelamento */}
        {formData.forma_pagamento === 'parcelado' && (
          <div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Parcelas
              </label>
              <input
                type="number"
                min="2"
                max="12"
                value={formData.numero_parcelas}
                onChange={(e) => setFormData({ ...formData, numero_parcelas: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={gerarParcelas}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Gerar Parcelas
              </button>
            </div>

            {formData.parcelas.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Parcelas</h5>
                {formData.parcelas.map((parcela, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {index + 1}ª Parcela - Valor
                        </label>
                        <input
                          type="text"
                          value={parcela.valor}
                          onChange={(e) => atualizarParcela(index, 'valor', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Vencimento
                        </label>
                        <input
                          type="date"
                          value={parcela.data_vencimento}
                          onChange={(e) => atualizarParcela(index, 'data_vencimento', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Outras Informações */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Outras Informações
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prazo para Alteração de Razão Social (dias)
            </label>
            <input
              type="number"
              value={formData.prazo_alteracao_razao}
              onChange={(e) => setFormData({ ...formData, prazo_alteracao_razao: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data do Contrato
            </label>
            <input
              type="date"
              value={formData.data_contrato}
              onChange={(e) => setFormData({ ...formData, data_contrato: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Resumo */}
      {formData.empresa_id && formData.vendedor_id && formData.compradores.length > 0 && formData.valor_total_venda && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h5 className="font-semibold text-green-900 dark:text-green-300 mb-2">
            ✅ Resumo do Contrato
          </h5>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• Empresa: {empresaSelecionada?.razao_social}</li>
            <li>• Vendedor: {vendedorSelecionado?.nome_completo}</li>
            <li>• Compradores: {formData.compradores.length}</li>
            <li>• Valor Total: R$ {formData.valor_total_venda}</li>
            <li>• Pagamento: {formData.forma_pagamento === 'a_vista' ? 'À Vista' : `${formData.numero_parcelas}x`}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

