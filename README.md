# Sabores do Bill — Pix Mercado Pago (validação pelo PDV)

Esta atualização adiciona a infraestrutura de Pix Copia e Cola via API Payments. Não ativa atendimento pelo WhatsApp ou finalização pública de pedidos. A geração e a consulta de cobranças exigem login administrativo no PDV. Crédito e débito continuam na maquininha Ton.

## 1. Banco de dados

Requer as tabelas, cardápio, etapa 4 e atualização das promoções já instaladas. Execute os arquivos completos no SQL Editor, nesta ordem:

1. `sql/01_Pix_e_Pagamentos.sql` → `PIX_PARTE_1_OK`.
2. `sql/02_Controle_Pix.sql` → `PIX_PARTE_2_OK`.

A parte 1 inclui os campos de troco e habilita Pix como opção de pedido. A parte 2 guarda e valida as cobranças. Os arquivos não criam usuários ou senhas e não devem ser executados parcialmente. A função interna de cálculo não fica acessível aos clientes.

## 2. GitHub e Netlify

Envie os arquivos e as pastas deste pacote para a raiz do repositório existente `sabores-do-bill`, preservando a estrutura das pastas. Não envie somente o ZIP.

O arquivo `netlify.toml` define `public` como pasta publicada e `netlify/functions` como pasta das funções. Os arquivos antigos na raiz podem continuar no repositório, mas a versão publicada virá de `public/`. Não publique toda a raiz. A pasta `public` contém o cardápio e o PDV com visual incorporado. O Netlify compila as funções ao publicar pelo GitHub.

## 3. Variáveis privadas no Netlify

Configure pelo painel do Netlify, com escopo Functions ou todos os escopos, e publique novamente após salvar. Nunca coloque os valores no GitHub, no HTML ou no chat.

| Nome | Conteúdo |
| --- | --- |
| `MP_ACCESS_TOKEN` | Access Token de TESTE da aplicação Mercado Pago; ou credencial de vendedor de teste compatível com Pix. |
| `MP_WEBHOOK_SECRET` | Assinatura secreta gerada na configuração de Webhooks da aplicação. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave JWT legada `service_role` do projeto Supabase, somente no servidor. Não usar a chave pública neste campo. |
| `MP_MODE` | `test` nesta fase. |
| `PIX_ENABLED` | Começar com `false`. Mudar para `true` somente após completar SQL, funções e Webhook. |

A URL e chave pública do Supabase já estão no código do cliente, como na versão anterior. As credenciais privadas são lidas apenas no servidor.

## 4. Webhook Mercado Pago

Na aplicação Sabores do Bill, em Webhooks, configure o evento **Pagamentos / payment** para a integração com API Payments. A URL deste código é:

`https://sabores-do-bill.netlify.app/.netlify/functions/mp-webhook`

Só configure após a publicação das funções. Escolha o ambiente de teste e obtenha a assinatura secreta para `MP_WEBHOOK_SECRET`. O endereço responde a POST; abri-lo na barra do navegador retorna método não permitido, o que não indica falha de publicação. Eventos sem assinatura válida são recusados.

Uma simulação com ID fictício pode não representar um pagamento consultável. A validação final exige uma cobrança de teste vinculada a um pedido do nosso sistema. Credenciais e recursos de teste Pix devem ser compatíveis com o modo escolhido pelo Mercado Pago. Se a API recusar os dados de teste, envie apenas a mensagem de erro, sem credenciais.

## 5. Validação pelo PDV

Após configurar, mudar `PIX_ENABLED=true`, republicar e atualizar as páginas:

1. Entre no PDV em `/pdv.html`.
2. Faça um novo pedido de teste e escolha Pix Copia e Cola — Mercado Pago.
3. Após registrar, use Gerar Pix Copia e Cola, ou abra o pedido no PDV e use Gerar / ver Pix.
4. Informe dados de pagador adequados ao ambiente de teste, incluindo e-mail e CPF.
5. Copie o código e consulte o status. Em produção o pagador o usa no aplicativo bancário; nesta fase não faça um pagamento real para simular um teste.

O mesmo pedido usa a mesma chave de cobrança para evitar duplicidade em tentativas repetidas. Uma cobrança expirada não é renovada automaticamente nesta versão. Se mudar de ambiente, use um novo pedido.

A aprovação em teste é exibida como teste e NÃO marca um pedido como pago de verdade. A aprovação em produção atualiza apenas o estado do pagamento; o status de produção/cozinha não é alterado. A confirmação após impressão e o WhatsApp ainda não estão integrados.

## 6. Antes de produção

Validar primeiro o fluxo completo com a conta, incluindo notificações. A publicação deste código não habilita produção por si só. Só mudar `MP_MODE=production` e usar credenciais produtivas quando a validação estiver concluída e a operação real tiver sido autorizada. O dinheiro de Pix será recebido no Mercado Pago, não na Ton.

## Validação realizada nesta entrega

- Sintaxe de todos os scripts e páginas incorporadas.
- Testes HTTP com serviços simulados: assinatura, identidade da cobrança, conta recebedora, valor, ambiente e chave de idempotência; nenhuma cobrança real criada.
- Execução das migrações em banco PostgreSQL local via PGlite com testes de permissões, reserva, valor e bloqueio de quitação real por aprovação simulada.
- A configuração real no Netlify e os testes na conta Mercado Pago ainda dependem das etapas acima.

`npm test` executa os testes das funções com serviços simulados, sem precisar de credenciais reais.
