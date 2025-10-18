"""
Script para popular o banco de dados com dados fictícios para demonstração no GitHub.
Este script é útil para quem quer testar o sistema sem dados reais.

AVISO: Este script irá CRIAR um novo banco de dados chamado 'sistema_contabil_demo.db'
        Seu banco de dados atual não será afetado.
"""

import json
import os
import sys
from datetime import datetime

# Adiciona o diretório backend ao path
sys.path.insert(0, os.path.dirname(__file__))

def criar_banco_demo():
    """Cria um banco de dados de demonstração com dados fictícios"""
    
    print("=" * 70)
    print(" CRIANDO BANCO DE DADOS DE DEMONSTRAÇÃO")
    print("=" * 70)
    print()
    print("Este script criará um banco 'sistema_contabil_demo.db' com dados")
    print("fictícios para demonstração. Seu banco atual não será afetado.")
    print()
    
    # Confirmar
    resposta = input("Deseja continuar? (s/N): ")
    if resposta.lower() != 's':
        print("\nOperação cancelada.")
        return
    
    try:
        # Configurar para usar banco demo
        os.environ['DATABASE_URL'] = 'sqlite:///sistema_contabil_demo.db'
        
        from dotenv import load_dotenv
        from app import create_app
        from app.models import db, Usuario, Cliente, Contador, Processamento, FaturamentoDetalhe, Recibo
        from werkzeug.security import generate_password_hash
        
        # Criar aplicação
        print("\n[1/6] Criando aplicação Flask...")
        app = create_app()
        
        # Forçar o caminho do banco demo
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sistema_contabil_demo.db'
        
        with app.app_context():
            # Remover banco demo se existir
            db_path = os.path.join(os.path.dirname(__file__), 'sistema_contabil_demo.db')
            if os.path.exists(db_path):
                print("[2/6] Removendo banco demo anterior...")
                os.remove(db_path)
            
            # Criar tabelas
            print("[3/6] Criando tabelas no banco demo...")
            db.create_all()
            
            # Carregar dados do JSON
            print("[4/6] Carregando dados fictícios...")
            with open('seed_github.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Criar usuários
            print("[5/6] Populando banco de dados...")
            print("  → Criando usuários...")
            usuarios_criados = {}
            for user_data in data.get('usuarios', []):
                usuario = Usuario(
                    username=user_data['username'],
                    email=user_data['email'],
                    senha_hash=generate_password_hash(user_data['senha']),
                    nome=user_data['nome'],
                    papel=user_data['papel'],
                    ativo=True
                )
                db.session.add(usuario)
                db.session.flush()
                usuarios_criados[user_data['username']] = usuario
                print(f"     ✓ {user_data['nome']} ({user_data['username']})")
            
            # Criar contadores
            print("  → Criando contadores...")
            contadores_criados = {}
            for cont_data in data.get('contadores', []):
                contador = Contador(
                    nome=cont_data['nome'],
                    cpf=cont_data['cpf'],
                    crc=cont_data['crc'],
                    email=cont_data['email'],
                    telefone=cont_data.get('telefone'),
                    endereco=cont_data.get('endereco'),
                    cidade=cont_data.get('cidade'),
                    estado=cont_data.get('estado'),
                    cep=cont_data.get('cep')
                )
                db.session.add(contador)
                db.session.flush()
                contadores_criados[cont_data['cpf']] = contador
                print(f"     ✓ {cont_data['nome']} - {cont_data['crc']}")
            
            # Criar clientes
            print("  → Criando clientes...")
            clientes_criados = {}
            for cliente_data in data.get('clientes', []):
                cliente = Cliente(
                    razao_social=cliente_data['razao_social'],
                    cnpj=cliente_data['cnpj'],
                    regime_tributario=cliente_data['regime_tributario'],
                    nome_fantasia=cliente_data.get('nome_fantasia'),
                    data_abertura=cliente_data.get('data_abertura'),
                    situacao_cadastral=cliente_data.get('situacao_cadastral'),
                    data_situacao=cliente_data.get('data_situacao'),
                    natureza_juridica=cliente_data.get('natureza_juridica'),
                    cnae_principal=cliente_data.get('cnae_principal'),
                    logradouro=cliente_data.get('logradouro'),
                    numero=cliente_data.get('numero'),
                    complemento=cliente_data.get('complemento'),
                    bairro=cliente_data.get('bairro'),
                    cep=cliente_data.get('cep'),
                    municipio=cliente_data.get('municipio'),
                    uf=cliente_data.get('uf'),
                    telefone1=cliente_data.get('telefone1'),
                    telefone2=cliente_data.get('telefone2'),
                    email=cliente_data.get('email'),
                    capital_social=cliente_data.get('capital_social'),
                    porte=cliente_data.get('porte'),
                    opcao_simples=cliente_data.get('opcao_simples'),
                    data_opcao_simples=cliente_data.get('data_opcao_simples'),
                    opcao_mei=cliente_data.get('opcao_mei'),
                    valor_honorarios=cliente_data.get('valor_honorarios')
                )
                db.session.add(cliente)
                db.session.flush()
                clientes_criados[cliente_data['cnpj']] = cliente
                print(f"     ✓ {cliente_data['razao_social']}")
            
            # Criar processamentos de faturamento (se houver)
            if 'processamentos_exemplo' in data:
                print("  → Criando faturamentos exemplo...")
                for proc_data in data['processamentos_exemplo']:
                    cliente = clientes_criados.get(proc_data['cliente_cnpj'])
                    if cliente:
                        # Calcular imposto (simplificado)
                        faturamento = proc_data['faturamento_total']
                        if cliente.regime_tributario == 'Simples Nacional':
                            imposto = faturamento * 0.06
                        elif cliente.regime_tributario == 'Lucro Presumido':
                            imposto = faturamento * 0.1138
                        else:  # Lucro Real
                            imposto = faturamento * 0.15
                        
                        processamento = Processamento(
                            cliente_id=cliente.id,
                            mes=proc_data['mes'],
                            ano=proc_data['ano'],
                            faturamento_total=faturamento,
                            imposto_calculado=imposto,
                            nome_arquivo_original=proc_data['nome_arquivo_original'],
                            data_processamento=datetime.utcnow()
                        )
                        db.session.add(processamento)
                        db.session.flush()
                        
                        # Adicionar detalhes
                        for det_data in proc_data.get('detalhes', []):
                            detalhe = FaturamentoDetalhe(
                                processamento_id=processamento.id,
                                descricao_servico=det_data['descricao_servico'],
                                valor=det_data['valor']
                            )
                            db.session.add(detalhe)
                        
                        print(f"     ✓ Faturamento {proc_data['mes']}/{proc_data['ano']} - {cliente.razao_social}")
            
            # Criar recibos (se houver)
            if 'recibos_exemplo' in data:
                print("  → Criando recibos exemplo...")
                for recibo_data in data['recibos_exemplo']:
                    cliente = clientes_criados.get(recibo_data['cliente_cnpj'])
                    contador = contadores_criados.get(recibo_data['contador_cpf'])
                    usuario = usuarios_criados.get('admin')
                    
                    if cliente and contador and usuario:
                        # Gerar número de recibo
                        count = Recibo.query.filter_by(
                            mes=recibo_data['mes'],
                            ano=recibo_data['ano']
                        ).count()
                        numero_recibo = f"{recibo_data['ano']}{recibo_data['mes']:02d}{count+1:04d}"
                        
                        recibo = Recibo(
                            cliente_id=cliente.id,
                            contador_id=contador.id,
                            mes=recibo_data['mes'],
                            ano=recibo_data['ano'],
                            valor=recibo_data['valor'],
                            tipo_servico=recibo_data.get('tipo_servico', 'honorarios'),
                            descricao_servico=recibo_data.get('descricao_servico'),
                            numero_recibo=numero_recibo,
                            data_emissao=datetime.utcnow(),
                            usuario_emitente_id=usuario.id
                        )
                        db.session.add(recibo)
                        print(f"     ✓ Recibo {numero_recibo} - {cliente.razao_social}")
            
            # Commit
            print("\n[6/6] Salvando dados...")
            db.session.commit()
            
            print("\n" + "=" * 70)
            print(" ✓ BANCO DE DEMONSTRAÇÃO CRIADO COM SUCESSO!")
            print("=" * 70)
            print()
            print(f"Banco criado em: {db_path}")
            print()
            print("Estatísticas:")
            print(f"  • {len(data['usuarios'])} usuários")
            print(f"  • {len(data['contadores'])} contadores")
            print(f"  • {len(data['clientes'])} clientes")
            print(f"  • {len(data.get('processamentos_exemplo', []))} faturamentos")
            print(f"  • {len(data.get('recibos_exemplo', []))} recibos")
            print()
            print("Credenciais de acesso:")
            print("  Admin:")
            print("    Username: admin")
            print("    Senha: admin123")
            print()
            print("  Usuário:")
            print("    Username: usuario")
            print("    Senha: usuario123")
            print()
            print("Para usar este banco, renomeie 'sistema_contabil_demo.db' para")
            print("'sistema_contabil.db' (faça backup do seu banco atual primeiro!)")
            print()
            
    except Exception as e:
        print("\n" + "=" * 70)
        print(" ✗ ERRO AO CRIAR BANCO DE DEMONSTRAÇÃO")
        print("=" * 70)
        print(f"\nErro: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == '__main__':
    criar_banco_demo()

