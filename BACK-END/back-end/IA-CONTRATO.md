# Contrato da IA (`/api/ia/**`) para o front

Autenticação: o mesmo HTTP Basic de todo o sistema (o `requisitar` do `api.ts` já envia).
Perfis aceitos: `ADMINISTRADOR`, `FUNCIONARIO`, `PROFESSOR` (igual ao `SecurityConfig`).

## O que não mudou

`POST /api/ia/perguntar` — corpo `{ "pergunta": "..." }` — resposta `{ "resposta": "texto" }`.
`GET /api/ia/resumo-diario` — resposta `{ "resposta": "texto" }`.
O `iaService.ts` e a tela `IA.tsx` atuais continuam funcionando sem nenhuma alteração.

Mudança pequena: pergunta vazia agora devolve **400** com texto simples (antes dava 500).
Se o Gemini estiver indisponível (sem `GEMINI_API_KEY`, etc.), devolve **503** com texto simples.

## Novo: ação pendente de confirmação (2 passos)

Quando o usuário pede para alterar uma configuração, a IA **não altera**. Ela propõe, e a resposta ganha o campo `acaoPendente`:

```json
{
  "resposta": "Alterar a aparência do sistema de \"auto\" para \"escuro\". Vale para todos os usuários e gera uma notificação de mudança. Ainda não alterei nada: confirma?",
  "acaoPendente": {
    "id": "df9038b4-b520-44b1-aac8-e08a89eca7b5",
    "tipo": "ALTERAR_APARENCIA",
    "descricao": "Alterar a aparência do sistema de ...",
    "parametros": { "aparencia": "escuro" },
    "expiraEm": "2026-11-26T16:51:38Z"
  }
}
```

Tipos e parâmetros:

| tipo | parametros |
|---|---|
| `ALTERAR_APARENCIA` | `{ "aparencia": "claro" \| "escuro" \| "auto" }` |
| `ALTERAR_NOTIFICACAO` | `{ "campo": "notificacoesSistema" \| "faltasAtrasos" \| "alunosEmRisco" \| "novosAlunos" \| "professoresAusentes" \| "relatoriosEmail", "valor": true \| false }` |

Regras da ação pendente: vale 5 minutos (`expiraEm`), uso único, só quem pediu consegue confirmar, e uma proposta nova substitui a anterior do mesmo usuário.

### Passo 2 — confirmar

`POST /api/ia/acoes/{id}/confirmar` (sem corpo). Executa pelos services reais (`ConfiguracaoService`), grava e, para aparência, gera a notificação "Aparência alterada".

```json
{
  "resposta": "Pronto! A aparência do sistema agora está em \"escuro\" e a notificação da mudança foi registrada.",
  "acaoExecutada": { "id": "...", "tipo": "ALTERAR_APARENCIA", "descricao": "...", "parametros": { "aparencia": "escuro" } }
}
```

**O que o front deve fazer ao receber `acaoExecutada` do tipo `ALTERAR_APARENCIA`:** aplicar o tema na hora, como a tela de Configurações faz:

```ts
window.dispatchEvent(new CustomEvent("educontrol-tema-alterado", { detail: acao.parametros.aparencia }));
```

(e recarregar as notificações, para o aviso novo aparecer no sino).

### Ou cancelar

`POST /api/ia/acoes/{id}/cancelar` (sem corpo) → `{ "resposta": "Tudo bem, não alterei nada no sistema." }`.

### Confirmar escrevendo no chat

Se o usuário tem uma ação pendente e digita só "sim" / "confirmo" / "pode alterar" (ou "não" / "cancelar"), o `/perguntar` confirma/cancela e devolve o mesmo formato do passo 2. O front pode usar só os botões e ignorar isso.

### Erros dos endpoints de ação (texto simples)

- `404` "Ação não encontrada, já utilizada ou expirada." (também quando a ação é de outro usuário)
- `403` perdeu a permissão entre propor e confirmar
- `400` o service recusou o valor
- `401` sem login

## Dados reais que a IA responde sozinha (sem inventar)

Isso é resolvido por um roteador no back com os services reais (`TeamService`, `ConfiguracaoService`), não pelo modelo:

- **Contagem:** "quantos professores existem?", "quantos funcionários?", "quantos administradores/equipe?" → conta por `tipoAcesso` e informa quantos têm acesso ativo. Também "quantos alunos / turmas / salas?" (pode combinar: "quantos alunos, turmas e salas?").
- **Presença de hoje:** "quantos presentes hoje?", "quantos faltaram hoje?" → contagem real dos registros de hoje (presentes, atrasados, justificados, faltas, pendentes). Sem registros: diz que não há registro, sem presumir falta.
- **Como funciona o sistema:** as 4 sugestões rápidas da tela ("Como funciona o EduControl?", "Como funciona o controle de presença?", "Como gerar um relatório?", "O que posso perguntar para você?") e perguntas parecidas são respondidas por uma base de conhecimento real (`src/main/resources/ia/conhecimento-educontrol.md`, editável). O texto de "O que posso perguntar" muda conforme o perfil. Perguntas sobre o site que não casam com essas vão para o Gemini com essa mesma base no prompt e a regra de dizer "não consta" quando a função não existe.
- **Telefone:** "telefone do professor João Silva", "número da Maria", "meu telefone". Busca por nome sem acento e por parte do nome. Nenhum resultado → "Não encontrei…". Mais de um → lista só os nomes, sem telefone, e pede o nome completo. Sem telefone cadastrado → diz isso.
- **Aparência atual:** "qual o tema atual?".
- **Alterar aparência/notificações:** os dois passos acima.
- Qualquer outra pergunta vai para o Gemini com o contexto escolar (que agora inclui a contagem da equipe, sem dados pessoais).

## Regra de permissão (a mais simples e segura)

| Ação | ADMINISTRADOR | FUNCIONARIO | PROFESSOR |
|---|---|---|---|
| Contagens da equipe e aparência atual | sim | sim | sim |
| Telefone de qualquer membro da equipe | sim | sim | **só o próprio** |
| Alterar aparência ou notificações | sim | **não** | **não** |

A regra de alterar espelha `PUT /edu/config/**` (só administrador). Telefone de colega para professor é negado com mensagem explicando. A IA nunca informa CPF, endereço, data de nascimento, senha ou RFID. As permissões são conferidas de novo na hora de confirmar.

## Observações

- "Cor do sistema" no EduControl é a **aparência** (claro, escuro, automático). Cor específica (azul etc.) não existe: a IA diz isso e pergunta qual das três.
- Notificações: a IA só liga/desliga um item por vez e pergunta qual quando o usuário não diz.
- O estado das ações pendentes fica em memória (como os demais dados do back); reiniciar o servidor descarta as pendentes.
