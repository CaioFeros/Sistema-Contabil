// Converte números em extenso (até 999.999.999,99)

const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const dez_vinte = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function porExtenso(numero) {
  if (numero === 0) return 'zero';
  
  const partes = [];
  
  // Separa parte inteira e decimal
  const [inteiro, decimal] = numero.toString().split('.');
  const numInteiro = parseInt(inteiro);
  
  // Milhões
  const milhoes = Math.floor(numInteiro / 1000000);
  if (milhoes > 0) {
    if (milhoes === 1) {
      partes.push('um milhão');
    } else {
      partes.push(porExtensoMenorMil(milhoes) + ' milhões');
    }
  }
  
  // Milhares
  const milhares = Math.floor((numInteiro % 1000000) / 1000);
  if (milhares > 0) {
    if (milhares === 1) {
      partes.push('mil');
    } else {
      partes.push(porExtensoMenorMil(milhares) + ' mil');
    }
  }
  
  // Centenas
  const resto = numInteiro % 1000;
  if (resto > 0) {
    // Adiciona "e" se houver partes anteriores
    if (partes.length > 0 && resto < 100) {
      partes.push('e');
    }
    partes.push(porExtensoMenorMil(resto));
  }
  
  let extenso = partes.join(' ');
  
  // Capitaliza primeira letra
  extenso = extenso.charAt(0).toUpperCase() + extenso.slice(1);
  
  return extenso;
}

function porExtensoMenorMil(numero) {
  if (numero === 0) return '';
  if (numero === 100) return 'cem';
  
  const partes = [];
  
  // Centenas
  const cent = Math.floor(numero / 100);
  if (cent > 0) {
    partes.push(centenas[cent]);
  }
  
  const resto = numero % 100;
  
  if (resto > 0) {
    if (partes.length > 0) {
      partes.push('e');
    }
    
    if (resto >= 10 && resto < 20) {
      partes.push(dez_vinte[resto - 10]);
    } else {
      const dez = Math.floor(resto / 10);
      const unid = resto % 10;
      
      if (dez > 0) {
        partes.push(dezenas[dez]);
      }
      
      if (unid > 0) {
        if (dez > 0) {
          partes.push('e');
        }
        partes.push(unidades[unid]);
      }
    }
  }
  
  return partes.join(' ');
}

/**
 * Converte um valor monetário em extenso
 * @param {number} valor - Valor numérico (ex: 430.50)
 * @returns {string} - Valor por extenso (ex: "Quatrocentos e trinta reais e cinquenta centavos")
 */
export function valorPorExtenso(valor) {
  const [inteiro, decimal = '00'] = valor.toFixed(2).split('.');
  const numInteiro = parseInt(inteiro);
  const numDecimal = parseInt(decimal);
  
  let resultado = porExtenso(numInteiro);
  
  // Plural/singular para "real/reais"
  if (numInteiro === 1) {
    resultado += ' real';
  } else {
    resultado += ' reais';
  }
  
  // Adiciona centavos se houver
  if (numDecimal > 0) {
    resultado += ' e ' + porExtenso(numDecimal).toLowerCase();
    if (numDecimal === 1) {
      resultado += ' centavo';
    } else {
      resultado += ' centavos';
    }
  }
  
  return resultado;
}

export default valorPorExtenso;

