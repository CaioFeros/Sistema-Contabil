/**
 * Utilitário para mensagens de erro específicas e acionáveis
 * na importação de CSV
 */

/**
 * Categorias de erro
 */
export const CATEGORIAS_ERRO = {
  ARQUIVO: 'arquivo',
  VALIDACAO: 'validacao',
  REDE: 'rede',
  SERVIDOR: 'servidor',
  DADOS: 'dados',
  CONSOLIDACAO: 'consolidacao'
};

/**
 * Formata mensagem de erro específica baseada no tipo
 */
export const formatarErroImportacao = (error) => {
  // Erro de resposta da API
  if (error.response) {
    const { status, data } = error.response;
    
    // Erros específicos da API
    switch (status) {
      case 400:
        return {
          categoria: CATEGORIAS_ERRO.VALIDACAO,
          titulo: 'Erro de Validação',
          mensagem: data.erro || 'Dados inválidos no arquivo CSV.',
          solucao: 'Verifique se o arquivo está no formato correto e tente novamente.',
          detalhes: data.detalhes || null
        };
      
      case 404:
        if (error.config.url?.includes('/cnpj/')) {
          return {
            categoria: CATEGORIAS_ERRO.DADOS,
            titulo: 'CNPJ Não Encontrado',
            mensagem: 'O CNPJ não foi encontrado na Receita Federal.',
            solucao: 'Verifique se o CNPJ está correto (formato: 00.000.000/0000-00) e tente novamente.',
            detalhes: null
          };
        }
        return {
          categoria: CATEGORIAS_ERRO.SERVIDOR,
          titulo: 'Recurso Não Encontrado',
          mensagem: 'O recurso solicitado não foi encontrado.',
          solucao: 'Entre em contato com o suporte.',
          detalhes: null
        };
      
      case 409:
        return {
          categoria: CATEGORIAS_ERRO.VALIDACAO,
          titulo: 'Cliente Já Cadastrado',
          mensagem: 'Este cliente já está cadastrado no sistema.',
          solucao: 'Não é necessário cadastrar novamente. Continue com a importação.',
          detalhes: null
        };
      
      case 413:
        return {
          categoria: CATEGORIAS_ERRO.ARQUIVO,
          titulo: 'Arquivo Muito Grande',
          mensagem: 'O arquivo CSV excede o tamanho máximo permitido (5MB).',
          solucao: 'Divida o arquivo em partes menores ou remova notas antigas e tente novamente.',
          detalhes: null
        };
      
      case 422:
        return {
          categoria: CATEGORIAS_ERRO.VALIDACAO,
          titulo: 'Dados Inválidos',
          mensagem: data.erro || 'Os dados do arquivo não puderam ser processados.',
          solucao: 'Verifique:\n• Formato das datas (DD/MM/YYYY)\n• Valores numéricos (use vírgula como decimal)\n• CNPJ formatado corretamente',
          detalhes: data.detalhes || null
        };
      
      case 500:
      case 502:
      case 503:
        return {
          categoria: CATEGORIAS_ERRO.SERVIDOR,
          titulo: 'Erro no Servidor',
          mensagem: 'Ocorreu um erro interno no servidor.',
          solucao: 'Tente novamente em alguns segundos. Se o problema persistir, entre em contato com o suporte.',
          detalhes: data.erro || null
        };
      
      case 504:
        return {
          categoria: CATEGORIAS_ERRO.REDE,
          titulo: 'Timeout na Consulta',
          mensagem: 'A consulta à Receita Federal demorou muito e foi cancelada.',
          solucao: 'A Receita Federal pode estar lenta. Aguarde 30 segundos e tente novamente.',
          detalhes: null
        };
      
      default:
        return {
          categoria: CATEGORIAS_ERRO.SERVIDOR,
          titulo: `Erro ${status}`,
          mensagem: data.erro || 'Ocorreu um erro ao processar sua solicitação.',
          solucao: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.',
          detalhes: null
        };
    }
  }
  
  // Erro de requisição (sem resposta)
  if (error.request) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        categoria: CATEGORIAS_ERRO.REDE,
        titulo: 'Tempo Esgotado',
        mensagem: 'A requisição demorou muito e foi cancelada.',
        solucao: 'Verifique sua conexão com a internet e tente novamente.',
        detalhes: null
      };
    }
    
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return {
        categoria: CATEGORIAS_ERRO.REDE,
        titulo: 'Erro de Conexão',
        mensagem: 'Não foi possível conectar ao servidor.',
        solucao: 'Verifique:\n• Sua conexão com a internet\n• Se o servidor está online\n• Configurações de firewall',
        detalhes: null
      };
    }
    
    return {
      categoria: CATEGORIAS_ERRO.REDE,
      titulo: 'Erro de Comunicação',
      mensagem: 'Não foi possível comunicar com o servidor.',
      solucao: 'Verifique sua conexão e tente novamente.',
      detalhes: null
    };
  }
  
  // Erro de validação de arquivo
  if (error.message?.includes('CSV')) {
    return {
      categoria: CATEGORIAS_ERRO.ARQUIVO,
      titulo: 'Arquivo Inválido',
      mensagem: error.message,
      solucao: 'Selecione apenas arquivos no formato CSV (.csv) exportados da Prefeitura/SEFAZ.',
      detalhes: null
    };
  }
  
  // Erro genérico
  return {
    categoria: CATEGORIAS_ERRO.SERVIDOR,
    titulo: 'Erro Inesperado',
    mensagem: error.message || 'Ocorreu um erro inesperado.',
    solucao: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.',
    detalhes: null
  };
};

/**
 * Valida arquivo antes do upload
 */
export const validarArquivoCSV = (arquivo) => {
  const erros = [];
  
  // Valida extensão
  const nomeArquivo = arquivo.name.toLowerCase();
  if (!nomeArquivo.endsWith('.csv')) {
    erros.push({
      categoria: CATEGORIAS_ERRO.ARQUIVO,
      titulo: 'Formato Inválido',
      mensagem: `O arquivo "${arquivo.name}" não é um CSV.`,
      solucao: 'Selecione apenas arquivos com extensão .csv',
      detalhes: null
    });
  }
  
  // Valida tipo MIME
  const tiposValidos = ['text/csv', 'text/plain', 'application/csv', 'text/tab-separated-values'];
  if (arquivo.type && !tiposValidos.includes(arquivo.type)) {
    erros.push({
      categoria: CATEGORIAS_ERRO.ARQUIVO,
      titulo: 'Tipo de Arquivo Inválido',
      mensagem: `O tipo do arquivo "${arquivo.name}" não é suportado.`,
      solucao: 'Certifique-se de que o arquivo é um CSV válido exportado da Prefeitura/SEFAZ.',
      detalhes: `Tipo detectado: ${arquivo.type}`
    });
  }
  
  // Valida tamanho (máx 5MB)
  const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
  if (arquivo.size > tamanhoMaximo) {
    const tamanhoMB = (arquivo.size / (1024 * 1024)).toFixed(2);
    erros.push({
      categoria: CATEGORIAS_ERRO.ARQUIVO,
      titulo: 'Arquivo Muito Grande',
      mensagem: `O arquivo "${arquivo.name}" tem ${tamanhoMB}MB e excede o limite de 5MB.`,
      solucao: 'Divida o arquivo em partes menores (máx 500 notas por arquivo) ou remova notas antigas.',
      detalhes: null
    });
  }
  
  // Valida tamanho mínimo (mín 100 bytes)
  if (arquivo.size < 100) {
    erros.push({
      categoria: CATEGORIAS_ERRO.ARQUIVO,
      titulo: 'Arquivo Muito Pequeno',
      mensagem: `O arquivo "${arquivo.name}" parece estar vazio ou corrompido.`,
      solucao: 'Verifique se o arquivo foi exportado corretamente e tente novamente.',
      detalhes: null
    });
  }
  
  return erros;
};

/**
 * Formata múltiplos erros em uma mensagem consolidada
 */
export const consolidarErros = (erros) => {
  if (!erros || erros.length === 0) {
    return null;
  }
  
  if (erros.length === 1) {
    return erros[0];
  }
  
  return {
    categoria: CATEGORIAS_ERRO.VALIDACAO,
    titulo: `${erros.length} Erros Encontrados`,
    mensagem: erros.map((e, i) => `${i + 1}. ${e.mensagem}`).join('\n'),
    solucao: 'Corrija os erros acima e tente novamente.',
    detalhes: erros
  };
};

/**
 * Ícone baseado na categoria
 */
export const getIconeCategoria = (categoria) => {
  switch (categoria) {
    case CATEGORIAS_ERRO.ARQUIVO:
      return '📄';
    case CATEGORIAS_ERRO.VALIDACAO:
      return '⚠️';
    case CATEGORIAS_ERRO.REDE:
      return '🌐';
    case CATEGORIAS_ERRO.SERVIDOR:
      return '🔧';
    case CATEGORIAS_ERRO.DADOS:
      return '📊';
    case CATEGORIAS_ERRO.CONSOLIDACAO:
      return '💾';
    default:
      return '❌';
  }
};

/**
 * Cor baseada na categoria
 */
export const getCorCategoria = (categoria) => {
  switch (categoria) {
    case CATEGORIAS_ERRO.ARQUIVO:
      return 'red';
    case CATEGORIAS_ERRO.VALIDACAO:
      return 'yellow';
    case CATEGORIAS_ERRO.REDE:
      return 'orange';
    case CATEGORIAS_ERRO.SERVIDOR:
      return 'red';
    case CATEGORIAS_ERRO.DADOS:
      return 'yellow';
    case CATEGORIAS_ERRO.CONSOLIDACAO:
      return 'red';
    default:
      return 'red';
  }
};

