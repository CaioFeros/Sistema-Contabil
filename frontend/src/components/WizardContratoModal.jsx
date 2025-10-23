import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, FileText, Plus } from 'lucide-react';
import { listarTemplates, criarContrato, formatarTipoContrato } from '../services/contratoService';
import { listarEmpresas } from '../services/empresaService';
import { listarPessoasFisicas } from '../services/pessoaFisicaService';
import ContratoSocialForm from './ContratoSocialForm';
import ContratoExtincaoForm from './ContratoExtincaoForm';
import ContratoCompraVendaForm from './ContratoCompraVendaForm';
import ContratoAlteracaoForm from './ContratoAlteracaoForm';

const WizardContratoModal = ({ onClose, onSuccess }) => {
  const [passo, setPasso] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  // Dados do wizard
  const [templates, setTemplates] = useState([]);
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  
  const [titulo, setTitulo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Dados específicos dos formulários
  const [dadosContratoSocial, setDadosContratoSocial] = useState(null);
  const [dadosContratoExtincao, setDadosContratoExtincao] = useState(null);
  const [dadosContratoCompraVenda, setDadosContratoCompraVenda] = useState(null);
  const [dadosContratoAlteracao, setDadosContratoAlteracao] = useState(null);
  const [dadosContratoCustom, setDadosContratoCustom] = useState({ conteudo: '', titulo: 'Contrato Custom' });
  
  // Estados para ferramentas do contrato custom
  const [empresas, setEmpresas] = useState([]);
  const [clientesPF, setClientesPF] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [clientePFSelecionado, setClientePFSelecionado] = useState(null);
  const [variavelEmpresaSelecionada, setVariavelEmpresaSelecionada] = useState('');
  const [variavelPFSelecionada, setVariavelPFSelecionada] = useState('');
  const [erroVariavel, setErroVariavel] = useState('');
  
  const [conteudoPreview, setConteudoPreview] = useState('');

  // Carrega dados iniciais
  useEffect(() => {
    carregarTemplates();
  }, []);

  // Carrega empresas e clientes PF quando contrato custom é selecionado
  useEffect(() => {
    if (templateSelecionado?.tipo === 'contrato_custom') {
      carregarEmpresas();
      carregarClientesPF();
    }
  }, [templateSelecionado]);

  // Atualiza preview quando dados mudam
  useEffect(() => {
    if (passo === 2 && templateSelecionado) {
      gerarPreview();
    }
  }, [dadosContratoSocial, dadosContratoExtincao, dadosContratoCompraVenda, dadosContratoAlteracao, dadosContratoCustom, passo]);

  const carregarTemplates = async () => {
    try {
      const dados = await listarTemplates();
      // Garante que sempre é um array
      setTemplates(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([]); // Garante array vazio em caso de erro
      setErro('Erro ao carregar templates');
    }
  };

  const carregarEmpresas = async () => {
    try {
      const dados = await listarEmpresas();
      setEmpresas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setEmpresas([]);
    }
  };

  const carregarClientesPF = async () => {
    try {
      const dados = await listarPessoasFisicas();
      setClientesPF(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar pessoas físicas:', error);
      setClientesPF([]);
    }
  };

  // Função auxiliar para construir endereço completo no formato correto
  const construirEnderecoCompleto = (dados) => {
    const partes = [];
    
    // Logradouro + Número
    if (dados.logradouro && dados.numero) {
      partes.push(`${dados.logradouro.toUpperCase()}, ${dados.numero.padStart(5, '0')}`);
    } else if (dados.logradouro) {
      partes.push(dados.logradouro.toUpperCase());
    }
    
    // Complemento
    if (dados.complemento) {
      partes.push(dados.complemento.toUpperCase());
    }
    
    // Bairro
    if (dados.bairro) {
      partes.push(dados.bairro.toUpperCase());
    }
    
    // Município + UF
    if (dados.municipio && dados.uf) {
      partes.push(`${dados.municipio.toUpperCase()}, - ${dados.uf.toUpperCase()}`);
    } else if (dados.municipio) {
      partes.push(dados.municipio.toUpperCase());
    }
    
    // CEP
    if (dados.cep) {
      partes.push(`CEP: ${dados.cep}`);
    }
    
    return partes.join(', ') + '.';
  };

  // Funções para inserir variáveis no contrato custom
  const inserirVariavelEmpresa = () => {
    if (!variavelEmpresaSelecionada || !empresaSelecionada) return;
    
    const empresa = empresas.find(e => e.id === empresaSelecionada);
    if (!empresa) return;
    
    // Verifica se a variável tem dados cadastrados
    let valor = empresa[variavelEmpresaSelecionada];
    
    // Para endereço completo, verifica se há pelo menos logradouro e número
    if (variavelEmpresaSelecionada === 'endereco_completo') {
      if (!empresa.logradouro || !empresa.numero) {
        setErroVariavel(`Variável "${variavelEmpresaSelecionada}" não encontrada. Verifique o cadastro do cliente.`);
        setTimeout(() => setErroVariavel(''), 5000);
        return;
      }
    } else if (!valor || valor.trim() === '') {
      setErroVariavel(`Variável "${variavelEmpresaSelecionada}" não encontrada. Verifique o cadastro do cliente.`);
      setTimeout(() => setErroVariavel(''), 5000);
      return;
    }
    
    // Limpa erro se tudo estiver ok
    setErroVariavel('');
    
    // Insere apenas a variável, sem o valor
    const textoAtual = dadosContratoCustom.conteudo;
    const novoTexto = textoAtual + `{{${variavelEmpresaSelecionada}}}`;
    setDadosContratoCustom(prev => ({ ...prev, conteudo: novoTexto }));
  };

  const inserirVariavelPF = () => {
    if (!variavelPFSelecionada || !clientePFSelecionado) return;
    
    const cliente = clientesPF.find(c => c.id === clientePFSelecionado);
    if (!cliente) return;
    
    // Verifica se a variável tem dados cadastrados
    let valor = cliente[variavelPFSelecionada];
    
    // Para endereço completo, verifica se há pelo menos logradouro e número
    if (variavelPFSelecionada === 'endereco_completo') {
      if (!cliente.logradouro || !cliente.numero) {
        setErroVariavel(`Variável "${variavelPFSelecionada}" não encontrada. Verifique o cadastro do cliente.`);
        setTimeout(() => setErroVariavel(''), 5000);
        return;
      }
    } else if (!valor || valor.trim() === '') {
      setErroVariavel(`Variável "${variavelPFSelecionada}" não encontrada. Verifique o cadastro do cliente.`);
      setTimeout(() => setErroVariavel(''), 5000);
      return;
    }
    
    // Limpa erro se tudo estiver ok
    setErroVariavel('');
    
    // Insere apenas a variável, sem o valor
    const textoAtual = dadosContratoCustom.conteudo;
    const novoTexto = textoAtual + `{{${variavelPFSelecionada}}}`;
    setDadosContratoCustom(prev => ({ ...prev, conteudo: novoTexto }));
  };

  const prepararDadosVariaveisExtincao = () => {
    if (!dadosContratoExtincao) return {};

    const dados = {
      data_atual: new Date().toISOString().split('T')[0]
    };

    const empresa = dadosContratoExtincao.empresa;
    const socios = dadosContratoExtincao.socios || [];

    if (empresa) {
      // Dados da empresa do cadastro
      dados.empresa_razao_social = empresa.razao_social || '';
      dados.empresa_cnpj = empresa.cnpj || '';
      dados.empresa_nome_fantasia = empresa.nome_fantasia || '';
      
      // Endereço completo do cadastro - formatado corretamente
      const enderecoParts = [
        empresa.logradouro,
        empresa.numero,
        empresa.complemento,
        empresa.bairro,
        empresa.municipio,
        empresa.uf,
        empresa.cep ? `CEP ${empresa.cep}` : null
      ].filter(p => p && p.trim());
      
      // Formata endereço para o contrato
      dados.empresa_endereco_completo = enderecoParts.join(', ');
      
      dados.cidade_contrato = empresa.municipio || '';
      dados.uf_contrato = empresa.uf || '';
      dados.empresa_data_abertura = empresa.data_abertura || '';
      dados.empresa_nire = empresa.natureza_juridica || '';
      
      // Formata capital social corretamente
      const formatarCapitalSocial = (valor) => {
        if (!valor) return '0,00';
        // Se já está formatado com vírgula
        if (typeof valor === 'string' && valor.includes(',')) {
          return valor;
        }
        // Converte para número e formata
        const numero = parseFloat(valor.toString().replace(/\./g, '').replace(',', '.') || 0);
        return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };
      
      const capitalFormatado = formatarCapitalSocial(empresa.capital_social);
      
      // Valor de liquidação = Capital Social do cadastro (formatado)
      dados.valor_liquidacao = capitalFormatado;
      dados.valor_ativo = capitalFormatado;
      dados.valor_passivo = '0,00';
      dados.valor_patrimonio_liquido = capitalFormatado;
      dados.empresa_capital_social = capitalFormatado;
    }

    // Dados da extinção
    dados.data_balanco = dadosContratoExtincao.data_balanco || '';
    dados.data_encerramento = dadosContratoExtincao.data_encerramento || '';
    dados.responsavel_documentacao = dadosContratoExtincao.responsavel_documentacao || '';
    dados.motivo_extincao = dadosContratoExtincao.motivo_extincao || 'Não interesse na continuidade da empresa';

    // Dados do(s) sócio(s) com informações completas
    if (socios.length > 0) {
      socios.forEach((socio, index) => {
        const num = index + 1;
        dados[`socio_${num}_nome`] = socio.socio_nome || '';
        dados[`socio_${num}_cpf`] = socio.socio_cpf || '';
        dados[`socio_${num}_rg`] = socio.socio_rg || '';
        dados[`socio_${num}_nacionalidade`] = socio.socio_nacionalidade || 'Brasileira';
        dados[`socio_${num}_estado_civil`] = socio.socio_estado_civil || '';
        dados[`socio_${num}_regime_comunhao`] = socio.socio_regime_comunhao || '';
        dados[`socio_${num}_percentual`] = socio.percentual_participacao || '';
        dados[`socio_${num}_profissao`] = socio.socio_profissao || '';
        
        // Endereço completo do sócio (dos dados completos) - prioriza endereço do sócio
        if (socio.socio_endereco_completo && socio.socio_endereco_completo.trim()) {
          dados[`socio_${num}_endereco_completo`] = socio.socio_endereco_completo;
        } else if (socio.socio_logradouro) {
          // Monta endereço a partir dos campos individuais
          const enderecoSocioParts = [
            socio.socio_logradouro,
            socio.socio_numero,
            socio.socio_complemento,
            socio.socio_bairro,
            socio.socio_municipio,
            socio.socio_uf,
            socio.socio_cep ? `CEP ${socio.socio_cep}` : null
          ].filter(p => p && p.trim());
          dados[`socio_${num}_endereco_completo`] = enderecoSocioParts.join(', ');
        } else {
          // Se não tem endereço próprio, usa da empresa
          dados[`socio_${num}_endereco_completo`] = dados.empresa_endereco_completo;
        }
      });

      // Qualificação do primeiro sócio (principal) - dados completos
      const socio1 = socios[0];
      dados.socio_1_nome = socio1.socio_nome || '';
      dados.socio_1_cpf = socio1.socio_cpf || '';
      dados.socio_1_rg = socio1.socio_rg || '';
      dados.socio_1_nacionalidade = socio1.socio_nacionalidade || 'Brasileira';
      dados.socio_1_estado_civil = socio1.socio_estado_civil || '';
      dados.socio_1_regime_comunhao = socio1.socio_regime_comunhao || '';
      
      // Endereço do sócio 1 - prioriza próprio
      if (socio1.socio_endereco_completo && socio1.socio_endereco_completo.trim()) {
        dados.socio_1_endereco_completo = socio1.socio_endereco_completo;
      } else if (socio1.socio_logradouro) {
        const enderecoSocio1Parts = [
          socio1.socio_logradouro,
          socio1.socio_numero,
          socio1.socio_complemento,
          socio1.socio_bairro,
          socio1.socio_municipio,
          socio1.socio_uf,
          socio1.socio_cep ? `CEP ${socio1.socio_cep}` : null
        ].filter(p => p && p.trim());
        dados.socio_1_endereco_completo = enderecoSocio1Parts.join(', ');
      } else {
        dados.socio_1_endereco_completo = dados.empresa_endereco_completo;
      }

      // Assinaturas
      const assinaturas = socios.map(socio => {
        return `_____________________________________________________\n${socio.socio_nome}\nCPF – ${socio.socio_cpf}`;
      });
      dados.assinaturas_socios = assinaturas.join('\n\n');
      
      // Lista de distribuição de patrimônio (para distrato)
      if (socios.length > 1) {
        const distribuicao = socios.map(socio => {
          const capitalSocial = parseFloat(empresa.capital_social?.toString().replace('.', '').replace(',', '.') || 0);
          const valorSocio = (capitalSocial * parseFloat(socio.percentual_participacao || 0) / 100).toFixed(2);
          return `${socio.socio_nome}: ${socio.percentual_participacao}% = R$ ${valorSocio}`;
        });
        dados.distribuicao_patrimonio = distribuicao.join('\n');
      }

      // Lista de qualificação dos sócios no formato específico
      const qualificacoes = socios.map((socio, index) => {
        const num = index + 1;
        const estadoCivil = socio.socio_estado_civil || '';
        const regimeComunhao = socio.socio_regime_comunhao ? `, ${socio.socio_regime_comunhao}` : '';
        const dataNascimento = socio.socio_data_nascimento || '';
        const profissao = socio.socio_profissao || '';
        const nacionalidade = socio.socio_nacionalidade || 'Brasileira';
        const cpf = socio.socio_cpf || '';
        const rg = socio.socio_rg || '';
        const orgaoExpedidor = socio.socio_orgao_expedidor || '';
        const enderecoCompleto = dados[`socio_${num}_endereco_completo`] || '';
        
        // Formata data de nascimento
        const dataFormatada = dataNascimento ? new Date(dataNascimento).toLocaleDateString('pt-BR') : 'N/A';
        
        // Constrói a qualificação seguindo o formato especificado
        let qualificacao = `SÓCIO ${num} - ${socio.socio_nome.toUpperCase()},`;
        qualificacao += `\nnacionalidade ${nacionalidade},`;
        qualificacao += ` ${estadoCivil}${regimeComunhao},`;
        qualificacao += ` nascido em ${dataFormatada},`;
        qualificacao += ` ${profissao},`;
        qualificacao += `\ninscrito no CPF no. ${cpf},`;
        qualificacao += ` Identidade no. ${rg},`;
        if (orgaoExpedidor) {
          qualificacao += ` órgão\nexpedidor ${orgaoExpedidor}`;
        }
        qualificacao += ` residente e domiciliado no(a) ${enderecoCompleto}`;
        
        return qualificacao;
      });
      
      dados.lista_socios_qualificacao = qualificacoes.join(' e;\n\n');
    }

    return dados;
  };

  const prepararDadosVariaveisCompraVenda = () => {
    if (!dadosContratoCompraVenda) return {};

    const { empresa, vendedor, compradores, valor_total_venda, forma_pagamento, 
            parcelas, dados_bancarios_vendedor, prazo_alteracao_razao, data_contrato } = dadosContratoCompraVenda;

    const dados = {};

    // Dados da empresa
    if (empresa) {
      dados.empresa_razao_social = empresa.razao_social || '';
      dados.empresa_cnpj = empresa.cnpj || '';
      const enderecoParts = [
        empresa.logradouro,
        empresa.numero,
        empresa.bairro,
        empresa.municipio,
        empresa.uf,
        empresa.cep ? `CEP ${empresa.cep}` : null
      ].filter(p => p && p.trim());
      dados.empresa_endereco_completo = enderecoParts.join(', ');
      dados.empresa_marca_antiga = empresa.nome_fantasia || empresa.razao_social;
      dados.cidade_contrato = empresa.municipio || '';
      dados.uf_contrato = empresa.uf || '';
    }

    // Dados do vendedor
    if (vendedor) {
      const qualificacaoVendedor = `VENDEDORA: ${vendedor.nome_completo.toUpperCase()}, ${vendedor.nacionalidade || 'brasileira'}, ${vendedor.estado_civil || 'solteira'}, nascida em ${vendedor.data_nascimento || 'data não informada'}, ${vendedor.profissao || 'profissão não informada'}, filha de ${vendedor.nome_pai || 'não informado'} e ${vendedor.nome_mae || 'não informado'}, portadora do RG nº ${vendedor.rg || 'não informado'}, inscrita no CPF sob o nº ${vendedor.cpf}, residente e domiciliada em ${vendedor.logradouro}, ${vendedor.numero}, ${vendedor.bairro}, ${vendedor.municipio}, ${vendedor.uf}, CEP ${vendedor.cep}.`;
      dados.qualificacao_vendedor = qualificacaoVendedor;
      dados.vendedor_singular_plural = ''; // Vazio = singular
      dados.vendedor_conjugacao = ''; // Vazio = singular
    }

    // Dados dos compradores
    if (compradores && compradores.length > 0) {
      const qualificacoes = compradores.map((comprador, index) => {
        const num = index + 1;
        return `COMPRADOR${compradores.length > 1 ? ` ${num}` : ''}: ${comprador.nome_completo.toUpperCase()}, ${comprador.nacionalidade || 'brasileira'}, ${comprador.estado_civil || 'solteira'}, nascida em ${comprador.data_nascimento || 'data não informada'}, ${comprador.profissao || 'profissão não informada'}, filha de ${comprador.nome_pai || 'não informado'} e ${comprador.nome_mae || 'não informado'}, portadora do RG nº ${comprador.rg || 'não informado'}, inscrita no CPF sob o nº ${comprador.cpf}, residente e domiciliada em ${comprador.logradouro}, ${comprador.numero}, ${comprador.bairro}, ${comprador.municipio}, ${comprador.uf}, CEP ${comprador.cep}.`;
      });
      dados.qualificacao_compradores = qualificacoes.join('\n\n');
      dados.comprador_singular_plural = compradores.length > 1 ? 's' : '';
      dados.comprador_conjugacao = compradores.length > 1 ? 'm' : '';

      // Assinaturas
      const assinaturasCompradores = compradores.map(c => 
        `___________________________________________________________\n\nCOMPRADOR${compradores.length > 1 ? `A` : ''}: ${c.nome_completo.toUpperCase()}`
      ).join('\n\n');
      dados.assinaturas_compradores = assinaturasCompradores;
    }

    // Valores e pagamento
    dados.valor_total_venda = valor_total_venda || '0,00';
    dados.valor_total_venda_extenso = numeroPorExtenso(valor_total_venda) || 'zero reais';
    dados.forma_pagamento = forma_pagamento === 'a_vista' ? 'à vista' : 'a prazo';

    if (forma_pagamento === 'parcelado' && parcelas && parcelas.length > 0) {
      const detalhamentoParcelas = parcelas.map(p => {
        return `${p.numero}ª Parcela - No valor de R$ ${p.valor}, tal valor deve ser depositado na Conta Bancária de titularidade do VENDEDOR perante o Banco ${p.banco}, Agência ${p.agencia}, Conta ${p.conta} até ${new Date(p.data_vencimento).toLocaleDateString('pt-BR')}.`;
      }).join('\n\n');
      dados.detalhamento_pagamento = detalhamentoParcelas;
    } else {
      dados.detalhamento_pagamento = `Pagamento à vista na conta bancária do VENDEDOR: Banco ${dados_bancarios_vendedor?.banco || ''}, Agência ${dados_bancarios_vendedor?.agencia || ''}, Conta ${dados_bancarios_vendedor?.conta || ''}.`;
    }

    dados.prazo_alteracao_razao = prazo_alteracao_razao || '180';
    dados.data_contrato = data_contrato ? new Date(data_contrato).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

    // Assinatura do vendedor
    dados.assinaturas_vendedores = `___________________________________________________________\n\nVENDEDOR${vendedor ? 'A' : ''}: ${vendedor?.nome_completo.toUpperCase() || ''}`;

    return dados;
  };

  // Função auxiliar para converter número em extenso (simplificada)
  const numeroPorExtenso = (valorStr) => {
    if (!valorStr) return 'zero reais';
    const valor = parseFloat(valorStr.toString().replace(/\./g, '').replace(',', '.') || 0);
    // Implementação simplificada - você pode melhorar isso com uma biblioteca
    return `${valor.toFixed(2).replace('.', ',')} reais`;
  };

  const prepararDadosVariaveis = () => {
    // Verifica qual tipo de contrato está sendo criado
    if (templateSelecionado?.tipo === 'contrato_social' && dadosContratoSocial) {
      return prepararDadosVariaveisContratoSocial();
    } else if ((templateSelecionado?.tipo === 'extincao_unipessoal' || 
                templateSelecionado?.tipo === 'extincao_individual' ||
                templateSelecionado?.tipo === 'distrato') && dadosContratoExtincao) {
      return prepararDadosVariaveisExtincao();
    } else if (templateSelecionado?.tipo === 'compra_venda' && dadosContratoCompraVenda) {
      return prepararDadosVariaveisCompraVenda();
    } else if (templateSelecionado?.tipo === 'alteracao_contratual' && dadosContratoAlteracao) {
      return prepararDadosVariaveisAlteracao();
    } else if (templateSelecionado?.tipo === 'contrato_custom' && dadosContratoCustom) {
      return prepararDadosVariaveisCustom();
    }
    return {};
  };

  const prepararDadosVariaveisContratoSocial = () => {
    if (!dadosContratoSocial) return {};

    const dados = {
      data_atual: new Date().toISOString().split('T')[0]
    };

    // Dados da empresa
    dados.empresa_razao_social = dadosContratoSocial.razao_social || '';
    dados.empresa_nome_fantasia = dadosContratoSocial.nome_fantasia || '';
    dados.empresa_capital_social = dadosContratoSocial.capital_social || '';
    
    // CNAE Principal
    if (dadosContratoSocial.cnae_principal) {
      dados.empresa_cnae_principal = `${dadosContratoSocial.cnae_principal.codigo} - ${dadosContratoSocial.cnae_principal.descricao}`;
    }
    
    // Gera Objeto Social a partir das atividades dos CNAEs
    const atividades = [];
    
    if (dadosContratoSocial.cnae_principal?.lista_atividades) {
      atividades.push(...dadosContratoSocial.cnae_principal.lista_atividades);
    }
    
    if (dadosContratoSocial.cnaes_secundarios) {
      dadosContratoSocial.cnaes_secundarios.forEach(cnae => {
        if (cnae.lista_atividades) {
          atividades.push(...cnae.lista_atividades);
        }
      });
    }
    
    dados.empresa_objeto_social = atividades.length > 0 ? atividades.join('; ') : dadosContratoSocial.cnae_principal?.descricao || '';
    
    // Lista de CNAEs com código e descrição
    const cnaesList = [];
    if (dadosContratoSocial.cnae_principal) {
      cnaesList.push(`${dadosContratoSocial.cnae_principal.codigo} - ${dadosContratoSocial.cnae_principal.descricao}`);
    }
    dadosContratoSocial.cnaes_secundarios?.forEach(c => {
      cnaesList.push(`${c.codigo} - ${c.descricao}`);
    });
    dados.empresa_cnaes = cnaesList.join('\n');
    
    // Endereço
    const endereco = `${dadosContratoSocial.logradouro}, ${dadosContratoSocial.numero}, ${dadosContratoSocial.complemento}, ${dadosContratoSocial.bairro}, ${dadosContratoSocial.municipio}, ${dadosContratoSocial.uf}, CEP ${dadosContratoSocial.cep}`;
    dados.empresa_endereco_completo = endereco.replace(/,\s*,/g, ',').trim();
    dados.cidade_contrato = dadosContratoSocial.municipio || '';
    dados.uf_contrato = dadosContratoSocial.uf || '';
    
    // Quotas
    const valorQuota = '1,00';
    const numeroQuotas = parseFloat(dadosContratoSocial.capital_social || 0).toFixed(2).replace('.', '');
    dados.empresa_valor_quota = valorQuota;
    dados.empresa_numero_quotas = numeroQuotas;
    
    // Sócios
    if (dadosContratoSocial.socios && dadosContratoSocial.socios.length > 0) {
      // Qualificação dos sócios
      const qualificacoes = dadosContratoSocial.socios.map((socio, index) => {
        const num = index + 1;
        const estadoCivil = socio.estado_civil || 'solteiro(a)';
        const regimeComunhao = socio.regime_comunhao ? `, ${socio.regime_comunhao}` : '';
        
        return `SÓCIO ${num} - ${socio.nome_completo}, ${socio.nacionalidade || 'Brasileira'}, ${estadoCivil}${regimeComunhao}, nascido em ${socio.data_nascimento || 'N/A'}, ${socio.profissao || 'Profissional'}, inscrito no CPF no. ${socio.cpf}, Identidade no. ${socio.rg}, residente e domiciliado no(a) ${socio.endereco_completo}`;
      });
      
      dados.lista_socios_qualificacao = qualificacoes.join(' e;\n\n');
      
      // Tabela de capital
      const tabelaCapital = dadosContratoSocial.socios.map((socio, index) => {
        const capitalSocio = (parseFloat(dadosContratoSocial.capital_social || 0) * parseFloat(socio.percentual_participacao || 0) / 100).toFixed(2);
        return `${socio.nome_completo} | ${socio.percentual_participacao}% | R$ ${capitalSocio}`;
      });
      
      dados.tabela_capital_socios = tabelaCapital.join('\n');
      
      // Administradores
      const administradores = dadosContratoSocial.socios
        .filter(s => s.cargo && s.cargo.toLowerCase().includes('administrador'))
        .map(s => s.nome_completo)
        .join(', ');
      
      dados.administradores = administradores || dadosContratoSocial.socios[0]?.nome_completo || '';
      
      // Dados individuais dos sócios
      dadosContratoSocial.socios.forEach((socio, index) => {
        const num = index + 1;
        dados[`socio_${num}_nome`] = socio.nome_completo;
        dados[`socio_${num}_cpf`] = socio.cpf;
        dados[`socio_${num}_rg`] = socio.rg;
        dados[`socio_${num}_nacionalidade`] = socio.nacionalidade || 'Brasileira';
        dados[`socio_${num}_estado_civil`] = socio.estado_civil;
        dados[`socio_${num}_regime_comunhao`] = socio.regime_comunhao;
        dados[`socio_${num}_endereco_completo`] = socio.endereco_completo;
        dados[`socio_${num}_percentual`] = socio.percentual_participacao;
        dados[`socio_${num}_profissao`] = socio.profissao;
        dados[`socio_${num}_cargo`] = socio.cargo;
      });
      
      // Assinaturas
      const assinaturas = dadosContratoSocial.socios.map(socio => {
        return `_____________________________________________________\n${socio.nome_completo}\nCPF: ${socio.cpf}`;
      });
      
      dados.assinaturas_socios = assinaturas.join('\n\n');
    }
    
    dados.forma_integralizacao = 'Dinheiro';
    dados.empresa_data_abertura = new Date().toISOString().split('T')[0];
    
    return dados;
  };

  const prepararDadosVariaveisAlteracao = () => {
    if (!dadosContratoAlteracao) return {};

    const dados = {
      data_atual: new Date().toISOString().split('T')[0]
    };

    const empresa = dadosContratoAlteracao.empresa;
    
    if (empresa) {
      dados.empresa_razao_social = empresa.razao_social || '';
      dados.empresa_cnpj = empresa.cnpj || '';
      dados.empresa_nome_fantasia = empresa.nome_fantasia || '';
      
      // Endereço completo
      const enderecoParts = [
        empresa.logradouro,
        empresa.numero,
        empresa.complemento,
        empresa.bairro,
        empresa.municipio,
        empresa.uf,
        empresa.cep ? `CEP ${empresa.cep}` : null
      ].filter(p => p && p.trim());
      
      dados.empresa_endereco_completo = enderecoParts.join(', ');
      dados.cidade_contrato = empresa.municipio || '';
      dados.uf_contrato = empresa.uf || '';
    }

    // Tipos de alteração selecionados
    const tiposAlteracao = [];
    if (dadosContratoAlteracao.tipos_alteracao.quadro_societario) tiposAlteracao.push('Mudança de Quadro Societário');
    if (dadosContratoAlteracao.tipos_alteracao.capital_social) tiposAlteracao.push('Alteração no Capital Social');
    if (dadosContratoAlteracao.tipos_alteracao.quadro_atividades) tiposAlteracao.push('Alteração no Quadro de Atividades');
    if (dadosContratoAlteracao.tipos_alteracao.endereco) tiposAlteracao.push('Alteração de Endereço');
    dados.tipos_alteracao_lista = tiposAlteracao.join(', ');

    // Dados de Quadro Societário
    if (dadosContratoAlteracao.quadro_societario) {
      const qs = dadosContratoAlteracao.quadro_societario;
      
      // Sócios atuais
      if (qs.sociosAtuais && qs.sociosAtuais.length > 0) {
        const sociosAtuaisTexto = qs.sociosAtuais.map(s => 
          `${s.nome_completo} (CPF: ${s.cpf}, Participação: ${s.percentual_participacao}%)`
        ).join('; ');
        dados.socios_atuais = sociosAtuaisTexto;
      }
      
      // Alterações
      if (qs.alteracoes && qs.alteracoes.length > 0) {
        const alteracoesTexto = qs.alteracoes.map((alt, index) => {
          if (alt.tipo === 'adicionar') {
            return `${index + 1}) Adicionar sócio: ${alt.dados.nome_completo} (CPF: ${alt.dados.cpf}, Participação: ${alt.dados.percentual_participacao}%)`;
          } else if (alt.tipo === 'remover') {
            const socio = qs.sociosAtuais.find(s => s.id === parseInt(alt.socio_id));
            return `${index + 1}) Remover sócio: ${socio?.nome_completo || 'N/A'}`;
          } else if (alt.tipo === 'alterar') {
            const socio = qs.sociosAtuais.find(s => s.id === parseInt(alt.socio_id));
            return `${index + 1}) Alterar participação de ${socio?.nome_completo || 'N/A'} para ${alt.dados.percentual_participacao}%`;
          }
          return '';
        }).filter(t => t).join('\n');
        dados.alteracoes_quadro_societario = alteracoesTexto;
      }
    }

    // Dados de Capital Social
    if (dadosContratoAlteracao.capital_social) {
      const cs = dadosContratoAlteracao.capital_social;
      dados.capital_social_atual = cs.capital_atual || '0,00';
      dados.capital_social_novo = cs.capital_novo || '0,00';
      dados.forma_integralizacao = cs.forma_integralizacao || 'dinheiro';
      dados.justificativa_capital = cs.justificativa || '';
    }

    // Dados de Quadro de Atividades
    if (dadosContratoAlteracao.quadro_atividades) {
      const qa = dadosContratoAlteracao.quadro_atividades;
      
      // CNAEs atuais
      if (qa.cnaes_atuais && qa.cnaes_atuais.length > 0) {
        dados.cnaes_atuais = qa.cnaes_atuais.map(c => c.codigo).join(', ');
      }
      
      // CNAEs a adicionar
      if (qa.cnaes_adicionar && qa.cnaes_adicionar.length > 0) {
        dados.cnaes_adicionar = qa.cnaes_adicionar.map(c => `${c.codigo} - ${c.descricao}`).join('\n');
      }
      
      // CNAEs a remover
      if (qa.cnaes_remover && qa.cnaes_remover.length > 0) {
        dados.cnaes_remover = qa.cnaes_remover.map(c => c.codigo).join(', ');
      }
    }

    // Dados de Endereço
    if (dadosContratoAlteracao.endereco) {
      const end = dadosContratoAlteracao.endereco;
      
      // Endereço atual
      const enderecoAtualParts = [
        end.endereco_atual.logradouro,
        end.endereco_atual.numero,
        end.endereco_atual.complemento,
        end.endereco_atual.bairro,
        end.endereco_atual.municipio,
        end.endereco_atual.uf,
        end.endereco_atual.cep ? `CEP ${end.endereco_atual.cep}` : null
      ].filter(p => p && p.trim());
      dados.endereco_atual = enderecoAtualParts.join(', ');
      
      // Novo endereço
      const enderecoNovoParts = [
        end.logradouro,
        end.numero,
        end.complemento,
        end.bairro,
        end.municipio,
        end.uf,
        end.cep ? `CEP ${end.cep}` : null
      ].filter(p => p && p.trim());
      dados.endereco_novo = enderecoNovoParts.join(', ');
    }

    return dados;
  };

  const prepararDadosVariaveisCustom = () => {
    if (!dadosContratoCustom) return {};

    const dados = {
      data_atual: new Date().toISOString().split('T')[0],
      titulo_contrato: dadosContratoCustom.titulo || 'Contrato Custom',
      conteudo_contrato: dadosContratoCustom.conteudo || ''
    };

    // Sempre adiciona dados da empresa selecionada se houver
    if (empresaSelecionada) {
      const empresa = empresas.find(e => e.id === empresaSelecionada);
      if (empresa) {
        dados.razao_social = empresa.razao_social || '';
        dados.nome_fantasia = empresa.nome_fantasia || '';
        dados.cnpj = empresa.cnpj || '';
        dados.capital_social = empresa.capital_social || '';
        dados.cnae_principal = empresa.cnae_principal || '';
        dados.regime_tributario = empresa.regime_tributario || '';
        dados.data_abertura = empresa.data_abertura || '';
        dados.situacao_cadastral = empresa.situacao_cadastral || '';
        dados.natureza_juridica = empresa.natureza_juridica || '';
        dados.porte = empresa.porte || '';
        dados.telefone1 = empresa.telefone1 || '';
        dados.telefone2 = empresa.telefone2 || '';
        dados.email = empresa.email || '';
        dados.logradouro = empresa.logradouro || '';
        dados.numero = empresa.numero || '';
        dados.complemento = empresa.complemento || '';
        dados.bairro = empresa.bairro || '';
        dados.municipio = empresa.municipio || '';
        dados.uf = empresa.uf || '';
        dados.cep = empresa.cep || '';
        
        // Endereço completo da empresa usando função auxiliar
        dados.endereco_completo = construirEnderecoCompleto(empresa);
      }
    }

    // Sempre adiciona dados do cliente PF selecionado se houver
    if (clientePFSelecionado) {
      const cliente = clientesPF.find(c => c.id === clientePFSelecionado);
      if (cliente) {
        dados.nome_completo = cliente.nome_completo || '';
        dados.cpf = cliente.cpf || '';
        dados.rg = cliente.rg || '';
        dados.data_nascimento = cliente.data_nascimento || '';
        dados.estado_civil = cliente.estado_civil || '';
        dados.regime_comunhao = cliente.regime_comunhao || '';
        dados.telefone1 = cliente.telefone1 || '';
        dados.telefone2 = cliente.telefone2 || '';
        dados.email = cliente.email || '';
        dados.logradouro = cliente.logradouro || '';
        dados.numero = cliente.numero || '';
        dados.complemento = cliente.complemento || '';
        dados.bairro = cliente.bairro || '';
        dados.municipio = cliente.municipio || '';
        dados.uf = cliente.uf || '';
        dados.cep = cliente.cep || '';
        
        // Endereço completo do cliente PF usando função auxiliar
        dados.endereco_completo_pf = construirEnderecoCompleto(cliente);
      }
    }

    // SEMPRE adiciona valores padrão para todas as variáveis possíveis
    // Isso garante que todas as variáveis sejam substituídas, mesmo sem seleção
    dados.razao_social = dados.razao_social || '[RAZÃO SOCIAL]';
    dados.nome_fantasia = dados.nome_fantasia || '[NOME FANTASIA]';
    dados.cnpj = dados.cnpj || '[CNPJ]';
    dados.capital_social = dados.capital_social || '[CAPITAL SOCIAL]';
    dados.cnae_principal = dados.cnae_principal || '[CNAE]';
    dados.regime_tributario = dados.regime_tributario || '[REGIME TRIBUTÁRIO]';
    dados.data_abertura = dados.data_abertura || '[DATA ABERTURA]';
    dados.situacao_cadastral = dados.situacao_cadastral || '[SITUAÇÃO CADASTRAL]';
    dados.natureza_juridica = dados.natureza_juridica || '[NATUREZA JURÍDICA]';
    dados.porte = dados.porte || '[PORTE DA EMPRESA]';
    dados.telefone1 = dados.telefone1 || '[TELEFONE PRINCIPAL]';
    dados.telefone2 = dados.telefone2 || '[TELEFONE SECUNDÁRIO]';
    dados.email = dados.email || '[E-MAIL]';
    dados.endereco_completo = dados.endereco_completo || '[ENDEREÇO COMPLETO]';
    dados.logradouro = dados.logradouro || '[LOGRADOURO]';
    dados.numero = dados.numero || '[NÚMERO]';
    dados.complemento = dados.complemento || '[COMPLEMENTO]';
    dados.bairro = dados.bairro || '[BAIRRO]';
    dados.municipio = dados.municipio || '[MUNICÍPIO]';
    dados.uf = dados.uf || '[UF]';
    dados.cep = dados.cep || '[CEP]';
    dados.nome_completo = dados.nome_completo || '[NOME COMPLETO]';
    dados.cpf = dados.cpf || '[CPF]';
    dados.rg = dados.rg || '[RG]';
    dados.data_nascimento = dados.data_nascimento || '[DATA NASCIMENTO]';
    dados.estado_civil = dados.estado_civil || '[ESTADO CIVIL]';
    dados.regime_comunhao = dados.regime_comunhao || '[REGIME COMUNHÃO]';
    dados.endereco_completo_pf = dados.endereco_completo_pf || '[ENDEREÇO COMPLETO PF]';

    return dados;
  };

  const gerarPreview = () => {
    if (!templateSelecionado) return;
    
    const dadosVariaveis = prepararDadosVariaveis();
    let texto = templateSelecionado.conteudo;
    
    // Substitui variáveis
    Object.keys(dadosVariaveis).forEach(chave => {
      const regex = new RegExp(`\\{\\{${chave}\\}\\}`, 'g');
      texto = texto.replace(regex, dadosVariaveis[chave] || `{{${chave}}}`);
    });
    
    setConteudoPreview(texto);
  };

  const handleProximo = () => {
    if (passo === 1 && !templateSelecionado) {
      alert('Selecione um template');
      return;
    }
    
    setPasso(passo + 1);
  };

  const handleVoltar = () => {
    setPasso(passo - 1);
  };

  const handleFinalizar = async () => {
    if (!titulo.trim()) {
      alert('Digite um título para o contrato');
      return;
    }
    
    // Validações específicas
    if (isContratoSocial) {
      if (!dadosContratoSocial || !dadosContratoSocial.socios || dadosContratoSocial.socios.length === 0) {
        alert('Adicione pelo menos um sócio');
        return;
      }
    } else if (isContratoExtincao) {
      if (!dadosContratoExtincao || !dadosContratoExtincao.empresa) {
        alert('Selecione uma empresa para extinção');
        return;
      }
    } else if (isContratoAlteracao) {
      if (!dadosContratoAlteracao || !dadosContratoAlteracao.empresa) {
        alert('Selecione uma empresa para alteração');
        return;
      }
    } else if (isContratoCustom) {
      if (!dadosContratoCustom || !dadosContratoCustom.conteudo.trim()) {
        alert('Digite o conteúdo do contrato custom');
        return;
      }
    }
    
    try {
      setCarregando(true);
      setErro(null);
      
      const dadosVariaveis = prepararDadosVariaveis();
      
      let sociosEnvolvidos = [];
      let empresaId = null;
      
      if (isContratoSocial && dadosContratoSocial) {
        sociosEnvolvidos = dadosContratoSocial.socios.map(s => s.id);
        empresaId = null; // Novo contrato, ainda não tem empresa
      } else if (isContratoExtincao && dadosContratoExtincao) {
        sociosEnvolvidos = dadosContratoExtincao.socios.map(s => s.socio_id);
        empresaId = dadosContratoExtincao.empresa.id;
      } else if (isContratoAlteracao && dadosContratoAlteracao) {
        // Para alteração, pega sócios envolvidos nas alterações
        if (dadosContratoAlteracao.quadro_societario && dadosContratoAlteracao.quadro_societario.sociosAtuais) {
          sociosEnvolvidos = dadosContratoAlteracao.quadro_societario.sociosAtuais.map(s => s.id);
        }
        empresaId = dadosContratoAlteracao.empresa.id;
      } else if (isContratoCustom && dadosContratoCustom) {
        // Para contrato custom, não há sócios ou empresa específica
        sociosEnvolvidos = [];
        empresaId = null;
      }
      
      await criarContrato({
        template_id: templateSelecionado.id,
        empresa_id: empresaId,
        titulo: titulo,
        dados_variaveis: dadosVariaveis,
        socios_envolvidos: sociosEnvolvidos,
        status: 'rascunho',
        observacoes: observacoes
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      setErro('Erro ao criar contrato. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const isContratoSocial = templateSelecionado?.tipo === 'contrato_social';
  const isContratoExtincao = templateSelecionado?.tipo === 'extincao_unipessoal' || 
                              templateSelecionado?.tipo === 'extincao_individual' ||
                              templateSelecionado?.tipo === 'distrato';
  const isContratoCompraVenda = templateSelecionado?.tipo === 'compra_venda';
  const isContratoAlteracao = templateSelecionado?.tipo === 'alteracao_contratual';
  const isContratoCustom = templateSelecionado?.tipo === 'contrato_custom';
  const usaFormularioEspecifico = isContratoSocial || isContratoExtincao || isContratoCompraVenda || isContratoAlteracao || isContratoCustom;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full my-8">
        {/* Cabeçalho */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-lg z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Novo Contrato
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Passo {passo} de {usaFormularioEspecifico ? 2 : 3}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            {usaFormularioEspecifico ? (
              <>
                <div className={`flex-1 h-2 rounded-full transition-colors ${passo >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                <div className={`flex-1 h-2 rounded-full transition-colors ${passo >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </>
            ) : (
              <>
                <div className={`flex-1 h-2 rounded-full transition-colors ${passo >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                <div className={`flex-1 h-2 rounded-full transition-colors ${passo >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                <div className={`flex-1 h-2 rounded-full transition-colors ${passo >= 3 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {erro && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
              {erro}
            </div>
          )}

          {/* PASSO 1: Selecionar Template */}
          {passo === 1 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selecione o Tipo de Contrato
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setTemplateSelecionado(template)}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      templateSelecionado?.id === template.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <FileText className={`h-6 w-6 flex-shrink-0 ${
                        templateSelecionado?.id === template.id
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {template.nome}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {template.descricao}
                        </p>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                          {formatarTipoContrato(template.tipo)}
                        </span>
                      </div>
                      {templateSelecionado?.id === template.id && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 2: Formulário Específico ou Preview */}
          {passo === 2 && usaFormularioEspecifico && (
            <div className="space-y-6">
              {/* Título e Observações */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informações do Contrato
                </h4>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Título do Contrato <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder={isContratoSocial ? "Ex: Contrato Social - ABC LTDA" : 
                                   isContratoExtincao ? "Ex: Extinção - XYZ LTDA" :
                                   isContratoCustom ? "Ex: Contrato Custom - Personalizado" :
                                   "Ex: Contrato - ABC LTDA"}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={2}
                      placeholder="Observações adicionais..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Formulário de Contrato Social */}
              {isContratoSocial && (
                <ContratoSocialForm onDadosPreenchidos={setDadosContratoSocial} />
              )}

              {/* Formulário de Contrato de Extinção */}
              {isContratoExtincao && (
                <ContratoExtincaoForm 
                  tipoExtincao={templateSelecionado.tipo}
                  onDadosPreenchidos={setDadosContratoExtincao} 
                />
              )}

              {/* Formulário de Compra e Venda */}
              {isContratoCompraVenda && (
                <ContratoCompraVendaForm onDadosPreenchidos={setDadosContratoCompraVenda} />
              )}

              {/* Formulário de Alteração Contratual */}
              {isContratoAlteracao && (
                <ContratoAlteracaoForm onDadosPreenchidos={setDadosContratoAlteracao} />
              )}

              {/* Formulário de Contrato Custom */}
              {isContratoCustom && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Título do Contrato
                    </label>
                    <input
                      type="text"
                      value={dadosContratoCustom.titulo}
                      onChange={(e) => setDadosContratoCustom(prev => ({ ...prev, titulo: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Digite o título do contrato"
                    />
                  </div>

                  {/* Mensagem de Erro */}
                  {erroVariavel && (
                    <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800 dark:text-red-200">{erroVariavel}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ferramentas de Inserção - Primeira Linha */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selecionar Empresa
                      </label>
                      <select
                        value={empresaSelecionada || ''}
                        onChange={(e) => setEmpresaSelecionada(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white text-sm"
                      >
                        <option value="">Selecione uma empresa</option>
                        {empresas.map(empresa => (
                          <option key={empresa.id} value={empresa.id}>
                            {empresa.razao_social || empresa.nome_fantasia}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Variável da Empresa
                      </label>
                      <select
                        value={variavelEmpresaSelecionada}
                        onChange={(e) => setVariavelEmpresaSelecionada(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white text-sm"
                      >
                        <option value="">Selecione uma variável</option>
                        <option value="razao_social">Razão Social</option>
                        <option value="nome_fantasia">Nome Fantasia</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="capital_social">Capital Social</option>
                        <option value="cnae_principal">CNAE Principal</option>
                        <option value="regime_tributario">Regime Tributário</option>
                        <option value="data_abertura">Data de Abertura</option>
                        <option value="situacao_cadastral">Situação Cadastral</option>
                        <option value="natureza_juridica">Natureza Jurídica</option>
                        <option value="porte">Porte da Empresa</option>
                        <option value="telefone1">Telefone Principal</option>
                        <option value="telefone2">Telefone Secundário</option>
                        <option value="email">E-mail</option>
                        <option value="endereco_completo">Endereço Completo</option>
                        <option value="logradouro">Logradouro</option>
                        <option value="numero">Número</option>
                        <option value="complemento">Complemento</option>
                        <option value="bairro">Bairro</option>
                        <option value="municipio">Município</option>
                        <option value="uf">UF</option>
                        <option value="cep">CEP</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={inserirVariavelEmpresa}
                        disabled={!empresaSelecionada || !variavelEmpresaSelecionada}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Inserir</span>
                      </button>
                    </div>
                  </div>

                  {/* Ferramentas de Inserção - Segunda Linha */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selecionar Cliente PF
                      </label>
                      <select
                        value={clientePFSelecionado || ''}
                        onChange={(e) => setClientePFSelecionado(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white text-sm"
                      >
                        <option value="">Selecione um cliente PF</option>
                        {clientesPF.map(cliente => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nome_completo}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Variável da Pessoa Física
                      </label>
                      <select
                        value={variavelPFSelecionada}
                        onChange={(e) => setVariavelPFSelecionada(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white text-sm"
                      >
                        <option value="">Selecione uma variável</option>
                        <option value="nome_completo">Nome Completo</option>
                        <option value="cpf">CPF</option>
                        <option value="rg">RG</option>
                        <option value="data_nascimento">Data de Nascimento</option>
                        <option value="estado_civil">Estado Civil</option>
                        <option value="regime_comunhao">Regime de Comunhão</option>
                        <option value="telefone1">Telefone Principal</option>
                        <option value="telefone2">Telefone Secundário</option>
                        <option value="email">E-mail</option>
                        <option value="endereco_completo">Endereço Completo</option>
                        <option value="logradouro">Logradouro</option>
                        <option value="numero">Número</option>
                        <option value="complemento">Complemento</option>
                        <option value="bairro">Bairro</option>
                        <option value="municipio">Município</option>
                        <option value="uf">UF</option>
                        <option value="cep">CEP</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={inserirVariavelPF}
                        disabled={!clientePFSelecionado || !variavelPFSelecionada}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Inserir</span>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Conteúdo do Contrato
                    </label>
                    <textarea
                      value={dadosContratoCustom.conteudo}
                      onChange={(e) => setDadosContratoCustom(prev => ({ ...prev, conteudo: e.target.value }))}
                      className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                      placeholder="Digite o conteúdo do contrato aqui..."
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              {((isContratoSocial && dadosContratoSocial) || (isContratoExtincao && dadosContratoExtincao) || (isContratoCompraVenda && dadosContratoCompraVenda) || (isContratoAlteracao && dadosContratoAlteracao) || (isContratoCustom && dadosContratoCustom.conteudo)) && conteudoPreview && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Preview do Contrato
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-gray-900 dark:text-white">
                      {conteudoPreview}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-lg">
          <div className="flex justify-between">
            <button
              onClick={passo === 1 ? onClose : handleVoltar}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {passo === 1 ? 'Cancelar' : 'Voltar'}
            </button>

            {passo < (usaFormularioEspecifico ? 2 : 3) ? (
              <button
                onClick={handleProximo}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Próximo</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleFinalizar}
                disabled={carregando}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Check className="h-5 w-5" />
                <span>{carregando ? 'Criando...' : 'Criar Contrato'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardContratoModal;
