"""
Módulo de validações para CPF, CNPJ e outros campos
"""
import re


def validar_cpf(cpf):
    """
    Valida um CPF brasileiro.
    Remove caracteres não numéricos e valida os dígitos verificadores.
    
    Args:
        cpf (str): CPF a ser validado (pode conter pontuação)
    
    Returns:
        tuple: (bool, str) - (é_válido, mensagem_erro)
    """
    # Remove caracteres não numéricos
    cpf_limpo = re.sub(r'[^\d]', '', str(cpf))
    
    # Verifica se tem 11 dígitos
    if len(cpf_limpo) != 11:
        return False, "CPF deve conter 11 dígitos"
    
    # Verifica se não é uma sequência de números iguais
    if cpf_limpo == cpf_limpo[0] * 11:
        return False, "CPF inválido - sequência de números iguais"
    
    # Valida primeiro dígito verificador
    soma = 0
    for i in range(9):
        soma += int(cpf_limpo[i]) * (10 - i)
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    if int(cpf_limpo[9]) != digito1:
        return False, "CPF inválido - dígito verificador incorreto"
    
    # Valida segundo dígito verificador
    soma = 0
    for i in range(10):
        soma += int(cpf_limpo[i]) * (11 - i)
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    if int(cpf_limpo[10]) != digito2:
        return False, "CPF inválido - dígito verificador incorreto"
    
    return True, ""


def validar_cnpj(cnpj):
    """
    Valida um CNPJ brasileiro.
    Remove caracteres não numéricos e valida os dígitos verificadores.
    
    Args:
        cnpj (str): CNPJ a ser validado (pode conter pontuação)
    
    Returns:
        tuple: (bool, str) - (é_válido, mensagem_erro)
    """
    # Remove caracteres não numéricos
    cnpj_limpo = re.sub(r'[^\d]', '', str(cnpj))
    
    # Verifica se tem 14 dígitos
    if len(cnpj_limpo) != 14:
        return False, "CNPJ deve conter 14 dígitos"
    
    # Verifica se não é uma sequência de números iguais
    if cnpj_limpo == cnpj_limpo[0] * 14:
        return False, "CNPJ inválido - sequência de números iguais"
    
    # Valida primeiro dígito verificador
    multiplicadores1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj_limpo[i]) * multiplicadores1[i] for i in range(12))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    if int(cnpj_limpo[12]) != digito1:
        return False, "CNPJ inválido - dígito verificador incorreto"
    
    # Valida segundo dígito verificador
    multiplicadores2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj_limpo[i]) * multiplicadores2[i] for i in range(13))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    if int(cnpj_limpo[13]) != digito2:
        return False, "CNPJ inválido - dígito verificador incorreto"
    
    return True, ""


def formatar_cpf(cpf):
    """
    Formata um CPF no padrão XXX.XXX.XXX-XX
    
    Args:
        cpf (str): CPF sem formatação
    
    Returns:
        str: CPF formatado
    """
    cpf_limpo = re.sub(r'[^\d]', '', str(cpf))
    if len(cpf_limpo) != 11:
        return cpf
    return f"{cpf_limpo[:3]}.{cpf_limpo[3:6]}.{cpf_limpo[6:9]}-{cpf_limpo[9:]}"


def formatar_cnpj(cnpj):
    """
    Formata um CNPJ no padrão XX.XXX.XXX/XXXX-XX
    
    Args:
        cnpj (str): CNPJ sem formatação
    
    Returns:
        str: CNPJ formatado
    """
    cnpj_limpo = re.sub(r'[^\d]', '', str(cnpj))
    if len(cnpj_limpo) != 14:
        return cnpj
    return f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:]}"


def limpar_documento(documento):
    """
    Remove pontuação e espaços de um documento (CPF ou CNPJ)
    
    Args:
        documento (str): Documento com ou sem formatação
    
    Returns:
        str: Documento apenas com números
    """
    return re.sub(r'[^\d]', '', str(documento))


def validar_email(email):
    """
    Valida formato básico de email
    
    Args:
        email (str): Email a ser validado
    
    Returns:
        tuple: (bool, str) - (é_válido, mensagem_erro)
    """
    if not email:
        return True, ""  # Email é opcional
    
    padrao = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(padrao, email):
        return False, "Email inválido"
    
    return True, ""


def validar_telefone(telefone):
    """
    Valida formato básico de telefone brasileiro
    
    Args:
        telefone (str): Telefone a ser validado
    
    Returns:
        tuple: (bool, str) - (é_válido, mensagem_erro)
    """
    if not telefone:
        return True, ""  # Telefone é opcional
    
    # Remove caracteres não numéricos
    telefone_limpo = re.sub(r'[^\d]', '', str(telefone))
    
    # Aceita telefones com 10 ou 11 dígitos (DDD + número)
    if len(telefone_limpo) not in [10, 11]:
        return False, "Telefone deve ter 10 ou 11 dígitos (incluindo DDD)"
    
    return True, ""

