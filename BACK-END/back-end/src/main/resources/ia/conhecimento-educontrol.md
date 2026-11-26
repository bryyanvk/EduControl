## VISAO_GERAL
O EduControl é um sistema de gestão escolar (secretaria) que controla a frequência dos alunos, o cadastro de alunos, turmas, salas e equipe, e gera relatórios e alertas.

O menu lateral tem: Início, Relatórios, Assistente de IA, Team (equipe), Presenças, Salas, Alunos, Settings (configurações) e Perfil. O que aparece depende do seu perfil. No topo das telas há o sino de notificações e a busca global.

- Início: boas-vindas, indicadores do dia, gráfico de frequência, pré-relatório e a lista "Alunos que precisam de atenção".
- Presenças: frequência do dia e registro de presença (veja "Como funciona o controle de presença").
- Alunos: lista, cadastro, detalhes e edição de alunos.
- Salas: salas e turmas.
- Team: cadastro e gestão de professores, funcionários e administradores.
- Relatórios: indicadores e exportação (veja "Como gerar um relatório").
- Settings: aparência, notificações, regras da escola e leitor RFID.
- Perfil: seus dados, foto e troca de senha.
- Assistente de IA: este chat.
O acesso é por matrícula ou e-mail e senha; há recuperação de senha por código enviado ao e-mail.

## PRESENCA
A frequência é registrada de duas formas:
1. RFID: o aluno aproxima o cartão do leitor e o registro é feito automaticamente, com horário. Registros feitos por RFID não podem ser alterados manualmente. Cada cartão RFID só pode pertencer a um aluno.
2. Manual: na tela Presenças, o botão "Registrar presença" (Administrador e Secretário) abre a lista de alunos por turma, onde se marca Presente, Atrasado, Justificado ou Ausente. Há também "marcar pendentes como presentes". Corrigir um registro manual atualiza o lançamento existente.

Situações: Presente, Atrasado, Justificado (falta justificada), Ausente/Falta e Pendente (ainda sem registro; pendente não é falta). Entradas depois do horário limite são Atrasado; o horário limite fica em Settings > Regras da escola (o padrão do sistema é 07:10).
A tela Presenças mostra o resumo do dia (presentes, atrasados, justificados, pendentes), o resumo por turma e uma tabela com filtros por turma, status e pesquisa.
O sistema gera alertas automáticos de faltas consecutivas: mais de 3 faltas seguidas gera atenção (FALTAS_CONSECUTIVAS) e 5 ou mais gera risco (ALUNO_RISCO). Atrasos e pendentes não contam como falta.

## RELATORIOS
Na tela Relatórios você vê: total de alunos, taxa de presença, alunos em atenção e alunos em risco, um gráfico de frequência e a tabela de alunos (presença, média e situação).
Filtros: Período (últimos 7 dias, últimos 30 dias, este mês, este ano), Turma, Disciplina e Tipo de relatório (Todos, Frequência, Alunos), além de pesquisa por aluno.
Para gerar: clique em "Gerar relatório", escolha o conteúdo (Frequência ou Alunos) e baixe em CSV ou em PDF. O arquivo respeita o período e a turma filtrados. A página Relatórios é do Administrador e do Secretário (professor não tem acesso).

## ALUNOS
Na tela Alunos há a lista com indicadores, busca e filtros, o botão "Novo aluno" (cadastro com turma e cartão RFID), detalhes do aluno e edição. Cadastrar e editar: Administrador e Secretário. Excluir aluno: somente Administrador (a exclusão é lógica e remove os alertas do aluno). Professor só consulta.

## SALAS_TURMAS
Na tela "Salas e turmas" ficam as salas (número, capacidade, andar, situação) e as turmas (nome, curso, turno). Uma sala pode existir sem turma e turmas podem ser vinculadas às salas. Criar, editar: Administrador e Secretário; excluir: Administrador. Professor só consulta.

## EQUIPE
A tela Team lista professores, funcionários e administradores. Cadastrar, editar, ativar/desativar acesso e excluir é do Administrador. O Secretário vê a lista. O primeiro usuário do sistema é sempre um Administrador.

## CONFIGURACOES
Em Settings há abas: Geral (aparência: claro, escuro ou automático), Notificações (notificações do sistema, faltas e atrasos, alunos em risco, novos alunos, professores ausentes, relatórios por e-mail), Regras da escola (horário limite, ano letivo, turno) e RFID (leitor ativo ou não). Também é lá que se altera a própria senha. Mudar a aparência gera a notificação "Aparência alterada". No back-end, só o Administrador salva configurações do sistema.

## NOTIFICACOES
O sino mostra alertas reais do sistema: faltas consecutivas, aluno em risco, novo funcionário, senha alterada, aparência alterada. Dá para marcar como lida. Apagar notificações é do Administrador.

## PERFIS
- Administrador: acesso total (inclui equipe, exclusões e configurações do sistema).
- Secretário (FUNCIONARIO no back-end): Início, Relatórios, IA, Team (consulta), Presenças (registrar e corrigir), Salas, Alunos (cadastrar e editar), Settings e Perfil. Não exclui alunos nem gerencia equipe.
- Professor: Início, IA, Presenças, Salas, Alunos e Perfil, somente para consulta; edita só o próprio perfil e senha.

## AJUDA_ADMINISTRADOR
Você pode me perguntar, por exemplo:
- "Quantos professores / funcionários / alunos / turmas / salas existem?"
- "Quantos alunos estão presentes hoje?" (e atrasados, faltas)
- "Qual o telefone do professor ...?"
- "Qual a aparência atual do sistema?" e pedir "mude a aparência para escuro" ou "desative as notificações de faltas" (eu peço sua confirmação antes de alterar).
- "Como funciona o controle de presença?", "Como gerar um relatório?", "Como cadastro um aluno?"
- Um resumo da situação (alunos em risco, notificações, frequência do dia).

## AJUDA_FUNCIONARIO
Você pode me perguntar, por exemplo:
- "Quantos professores / funcionários / alunos / turmas / salas existem?"
- "Quantos alunos estão presentes hoje?"
- "Qual o telefone do professor ...?"
- "Como funciona o controle de presença?", "Como gerar um relatório?", "Como cadastro um aluno?"
- Um resumo da situação (alunos em risco, notificações, frequência do dia).
Alterar configurações do sistema pelo assistente é só do Administrador.

## AJUDA_PROFESSOR
Você pode me perguntar, por exemplo:
- "Quantos professores / funcionários / alunos / turmas / salas existem?"
- "Quantos alunos estão presentes hoje?"
- "Qual é o meu telefone?" (por privacidade, só o seu próprio telefone)
- "Como funciona o EduControl?" e "Como funciona o controle de presença?"
Alterar configurações do sistema pelo assistente é só do Administrador.
