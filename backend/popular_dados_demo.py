#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados fictícios para demonstração.
Execute este script após criar o banco de dados para ter dados de exemplo.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import create_app, db
from backend.app.models import PessoaJuridica, PessoaFisica, Usuario, TemplateRelatorio
from datetime import datetime

def criar_dados_demo():
    """Cria dados fictícios para demonstração do sistema"""
    
    app = create_app()
    
    with app.app_context():
        # Criar usuário de demonstração
        usuario_demo = Usuario(
            nome='Usuário Demo',
            email='demo@sistemacontabil.com',
            senha_hash='$2b$12$demo_hash_here',  # Hash fictício
            ativo=True,
            admin=True
        )
        
        # Verificar se já existe
        if not Usuario.query.filter_by(email='demo@sistemacontabil.com').first():
            db.session.add(usuario_demo)
            db.session.commit()
            print("✅ Usuário demo criado")
        else:
            usuario_demo = Usuario.query.filter_by(email='demo@sistemacontabil.com').first()
            print("ℹ️ Usuário demo já existe")
        
        # Criar empresas fictícias
        empresas_demo = [
            {
                'razao_social': 'Tech Solutions LTDA',
                'nome_fantasia': 'TechSol',
                'cnpj': '12345678000190',
                'capital_social': 100000.00,
                'cnae_principal': '6201-5/00',
                'regime_tributario': 'SIMPLES_NACIONAL',
                'logradouro': 'Rua das Flores',
                'numero': '123',
                'bairro': 'Centro',
                'municipio': 'São Paulo',
                'uf': 'SP',
                'cep': '01234567',
                'telefone1': '(11) 99999-9999',
                'email': 'contato@techsol.com.br',
                'situacao_cadastral': 'ATIVA',
                'natureza_juridica': 'Sociedade Empresária Limitada',
                'porte': 'PEQUENO',
                'data_abertura': '2020-01-15'
            },
            {
                'razao_social': 'Consultoria Empresarial ME',
                'nome_fantasia': 'ConsultEmp',
                'cnpj': '98765432000110',
                'capital_social': 50000.00,
                'cnae_principal': '7020-4/00',
                'regime_tributario': 'LUCRO_PRESUMIDO',
                'logradouro': 'Av. Paulista',
                'numero': '1000',
                'bairro': 'Bela Vista',
                'municipio': 'São Paulo',
                'uf': 'SP',
                'cep': '01310100',
                'telefone1': '(11) 88888-8888',
                'email': 'info@consultemp.com.br',
                'situacao_cadastral': 'ATIVA',
                'natureza_juridica': 'Empresário Individual',
                'porte': 'MICRO',
                'data_abertura': '2019-06-20'
            }
        ]
        
        for empresa_data in empresas_demo:
            if not PessoaJuridica.query.filter_by(cnpj=empresa_data['cnpj']).first():
                empresa = PessoaJuridica(**empresa_data)
                db.session.add(empresa)
                print(f"✅ Empresa criada: {empresa_data['razao_social']}")
            else:
                print(f"ℹ️ Empresa já existe: {empresa_data['razao_social']}")
        
        # Criar pessoas físicas fictícias
        pessoas_demo = [
            {
                'nome_completo': 'João Silva Santos',
                'cpf': '12345678900',
                'rg': '123456789',
                'data_nascimento': '1985-03-15',
                'estado_civil': 'Casado',
                'regime_comunhao': 'Comunhão Parcial de Bens',
                'logradouro': 'Rua das Palmeiras',
                'numero': '456',
                'bairro': 'Jardim América',
                'municipio': 'São Paulo',
                'uf': 'SP',
                'cep': '01234567',
                'telefone1': '(11) 77777-7777',
                'email': 'joao.silva@email.com'
            },
            {
                'nome_completo': 'Maria Oliveira Costa',
                'cpf': '98765432100',
                'rg': '987654321',
                'data_nascimento': '1990-07-22',
                'estado_civil': 'Solteira',
                'regime_comunhao': None,
                'logradouro': 'Av. das Nações',
                'numero': '789',
                'bairro': 'Vila Nova',
                'municipio': 'São Paulo',
                'uf': 'SP',
                'cep': '01310200',
                'telefone1': '(11) 66666-6666',
                'email': 'maria.costa@email.com'
            }
        ]
        
        for pessoa_data in pessoas_demo:
            if not PessoaFisica.query.filter_by(cpf=pessoa_data['cpf']).first():
                pessoa = PessoaFisica(**pessoa_data)
                db.session.add(pessoa)
                print(f"✅ Pessoa física criada: {pessoa_data['nome_completo']}")
            else:
                print(f"ℹ️ Pessoa física já existe: {pessoa_data['nome_completo']}")
        
        # Criar templates de relatório de demonstração
        templates_demo = [
            {
                'titulo': 'Relatório de Análise Financeira',
                'conteudo': '''<h2>Relatório de Análise Financeira</h2>
                <p><strong>Empresa:</strong> {{razao_social}}</p>
                <p><strong>CNPJ:</strong> {{cnpj}}</p>
                <p><strong>Endereço:</strong> {{endereco_completo}}</p>
                <p><strong>Telefone:</strong> {{telefone1}}</p>
                <p><strong>Email:</strong> {{email}}</p>
                
                <h3>Dados Financeiros</h3>
                <p>Capital Social: {{capital_social}}</p>
                <p>Regime Tributário: {{regime_tributario}}</p>
                <p>CNAE Principal: {{cnae_principal}}</p>
                
                <p><em>Relatório gerado em {{data_atual}}</em></p>''',
                'tipo': 'relatorio_custom',
                'status': 'ativo',
                'usuario_criador_id': usuario_demo.id
            },
            {
                'titulo': 'Contrato de Prestação de Serviços',
                'conteudo': '''<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
                
                <p><strong>CONTRATANTE:</strong> {{razao_social}}, CNPJ {{cnpj}}, com sede em {{endereco_completo}}.</p>
                
                <p><strong>CONTRATADO:</strong> {{nome_completo}}, CPF {{cpf}}, residente e domiciliado em {{endereco_completo_pf}}.</p>
                
                <h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
                <p>O presente contrato tem por objeto a prestação de serviços de consultoria contábil.</p>
                
                <h3>CLÁUSULA SEGUNDA - DO VALOR</h3>
                <p>O valor dos serviços será de R$ 2.000,00 mensais.</p>
                
                <p><strong>Local e Data:</strong> São Paulo, {{data_atual}}</p>
                
                <p><strong>CONTRATANTE:</strong><br>
                {{razao_social}}<br>
                CNPJ: {{cnpj}}</p>
                
                <p><strong>CONTRATADO:</strong><br>
                {{nome_completo}}<br>
                CPF: {{cpf}}</p>''',
                'tipo': 'relatorio_custom',
                'status': 'ativo',
                'usuario_criador_id': usuario_demo.id
            }
        ]
        
        for template_data in templates_demo:
            if not TemplateRelatorio.query.filter_by(titulo=template_data['titulo']).first():
                template = TemplateRelatorio(**template_data)
                db.session.add(template)
                print(f"✅ Template criado: {template_data['titulo']}")
            else:
                print(f"ℹ️ Template já existe: {template_data['titulo']}")
        
        db.session.commit()
        print("\n🎉 Dados de demonstração criados com sucesso!")
        print("\n📋 Resumo dos dados criados:")
        print(f"- {PessoaJuridica.query.count()} empresas")
        print(f"- {PessoaFisica.query.count()} pessoas físicas")
        print(f"- {TemplateRelatorio.query.count()} templates de relatório")
        print(f"- {Usuario.query.count()} usuários")

if __name__ == '__main__':
    criar_dados_demo()
