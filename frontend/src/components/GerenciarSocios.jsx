import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { listarSocios, adicionarSocio, removerSocio, listarClientesPF } from '../services/socioService';

/**
 * Componente para gerenciar sócios de uma empresa (cliente PJ)
 */
const GerenciarSocios = ({ empresaId, empresaNome, isEditing }) => {
    const [socios, setSocios] = useState([]);
    const [clientesPF, setClientesPF] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [sucesso, setSucesso] = useState(null);
    const [adicionando, setAdicionando] = useState(false);
    
    // Estado do formulário de adição
    const [socioSelecionado, setSocioSelecionado] = useState('');
    const [percentual, setPercentual] = useState('');
    const [cargo, setCargo] = useState('Sócio');
    const [dataEntrada, setDataEntrada] = useState('');

    useEffect(() => {
        carregarDados();
    }, [empresaId]);

    const carregarDados = async () => {
        try {
            setLoading(true);
            setErro(null);
            
            // Carrega sócios da empresa
            const sociosData = await listarSocios(empresaId);
            setSocios(sociosData);
            
            // Carrega lista de clientes PF disponíveis
            const pfData = await listarClientesPF();
            setClientesPF(pfData);
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            setErro('Erro ao carregar informações de sócios');
        } finally {
            setLoading(false);
        }
    };

    const handleAdicionarSocio = async (e) => {
        e.preventDefault();
        
        if (!socioSelecionado) {
            setErro('Selecione um cliente pessoa física');
            return;
        }
        
        setAdicionando(true);
        setErro(null);
        setSucesso(null);
        
        try {
            const dadosSocio = {
                socio_id: parseInt(socioSelecionado),
                percentual_participacao: percentual ? parseFloat(percentual) : null,
                cargo: cargo || 'Sócio',
                data_entrada: dataEntrada || null
            };
            
            await adicionarSocio(empresaId, dadosSocio);
            
            // Recarrega a lista
            await carregarDados();
            
            // Limpa o formulário
            setSocioSelecionado('');
            setPercentual('');
            setCargo('Sócio');
            setDataEntrada('');
            
            setSucesso('Sócio adicionado com sucesso!');
            setTimeout(() => setSucesso(null), 3000);
            
        } catch (error) {
            console.error('Erro ao adicionar sócio:', error);
            setErro(error.response?.data?.erro || 'Erro ao adicionar sócio');
        } finally {
            setAdicionando(false);
        }
    };

    const handleRemoverSocio = async (socioId, socioNome) => {
        const confirmacao = window.confirm(
            `Tem certeza que deseja remover ${socioNome} da lista de sócios?`
        );
        
        if (!confirmacao) return;
        
        try {
            setErro(null);
            await removerSocio(empresaId, socioId);
            
            // Recarrega a lista
            await carregarDados();
            
            setSucesso('Sócio removido com sucesso!');
            setTimeout(() => setSucesso(null), 3000);
            
        } catch (error) {
            console.error('Erro ao remover sócio:', error);
            setErro(error.response?.data?.erro || 'Erro ao remover sócio');
        }
    };

    // Filtra clientes PF que ainda não são sócios
    const clientesDisponiveis = clientesPF.filter(
        pf => !socios.some(s => s.socio_id === pf.id)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <Users className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Sócios da Empresa
            </h4>

            {/* Mensagens */}
            {sucesso && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-200">{sucesso}</p>
                </div>
            )}

            {erro && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{erro}</p>
                </div>
            )}

            {/* Lista de Sócios */}
            {socios.length > 0 ? (
                <div className="mb-4">
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Nome
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        CPF
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Cargo
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Participação %
                                    </th>
                                    {isEditing && (
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Ações
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {socios.map((socio) => (
                                    <tr key={socio.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {socio.socio_nome}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {socio.socio_cpf}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {socio.cargo || 'Sócio'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {socio.percentual_participacao ? `${socio.percentual_participacao}%` : '-'}
                                        </td>
                                        {isEditing && (
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleRemoverSocio(socio.socio_id, socio.socio_nome)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                    title="Remover sócio"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg text-center">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nenhum sócio cadastrado para esta empresa
                    </p>
                </div>
            )}

            {/* Formulário para Adicionar Sócio */}
            {isEditing && clientesDisponiveis.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Sócio
                    </h5>
                    
                    <form onSubmit={handleAdicionarSocio} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Pessoa Física <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={socioSelecionado}
                                onChange={(e) => setSocioSelecionado(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Selecione um cliente PF...</option>
                                {clientesDisponiveis.map(pf => (
                                    <option key={pf.id} value={pf.id}>
                                        {pf.nome_completo} - CPF: {pf.cpf}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Cargo
                            </label>
                            <input
                                type="text"
                                value={cargo}
                                onChange={(e) => setCargo(e.target.value)}
                                placeholder="Ex: Sócio Administrador"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Participação %
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={percentual}
                                onChange={(e) => setPercentual(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Data de Entrada
                            </label>
                            <input
                                type="date"
                                value={dataEntrada}
                                onChange={(e) => setDataEntrada(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={adicionando || !socioSelecionado}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                            >
                                {adicionando ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Adicionando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        <span>Adicionar Sócio</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Aviso se não houver clientes PF disponíveis */}
            {isEditing && clientesDisponiveis.length === 0 && socios.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ℹ️ Não há clientes Pessoa Física cadastrados no sistema. Cadastre primeiro um cliente PF para adicioná-lo como sócio.
                    </p>
                </div>
            )}

            {isEditing && clientesDisponiveis.length === 0 && socios.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        ℹ️ Todos os clientes PF disponíveis já são sócios desta empresa.
                    </p>
                </div>
            )}
        </div>
    );
};

export default GerenciarSocios;

