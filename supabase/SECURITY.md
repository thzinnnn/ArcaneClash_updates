# Segurança da Conta Arcana

Esta pasta contém a autoridade de segurança do ArcanaClash. Nenhuma senha, chave secreta ou chave `service_role` deve ser adicionada ao repositório ou ao site.

## Aplicação inicial

1. No Supabase, abra **SQL Editor** usando uma conta proprietária protegida por MFA.
2. Execute `migrations/20260822173000_secure_accounts.sql`.
3. Crie a Conta Arcana normalmente no jogo, confirme o e-mail e faça login.
4. No SQL Editor, promova somente o e-mail do proprietário:

```sql
select private.arcana_promote_admin_by_email('SEU_EMAIL_CONFIRMADO');
```

5. Saia e entre novamente no jogo para renovar o token.
6. Ative o autenticador TOTP na tela Conta Arcana. As operações ADM exigem sessão `aal2`.

O procedimento de promoção não recebe senha. A função não pode ser chamada por jogadores, pelo papel anônimo ou pelo site.

## Proteções aplicadas

- Save fora de `user_metadata`, com isolamento por usuário e RLS forçada.
- Tabelas sem escrita direta pelo navegador; operações passam por RPCs restritas.
- Concorrência por revisão, idempotência por UUID e limite de frequência.
- Payload máximo de 256 KiB e remoção recursiva de tokens, e-mails, segredos e campos ADM.
- Progresso competitivo/economia confiável separado do save local não verificado.
- Funções ADM exigem papel armazenado em schema privado e MFA `aal2`.
- Toda alteração administrativa registra ator, alvo, motivo e valores antes/depois.
- Chaves publicáveis podem ficar no navegador; chaves secretas nunca podem.

## Configurações obrigatórias no painel

- Authentication → Password Security: mínimo de 12 caracteres e exigir maiúscula, minúscula, número e símbolo.
- Ativar proteção contra senhas vazadas quando o plano permitir.
- Manter confirmação de e-mail ativa.
- Ativar Cloudflare Turnstile ou hCaptcha em login e cadastro.
- Revisar os limites de autenticação e usar SMTP próprio antes de crescimento público.
- Ativar MFA na organização Supabase e 2FA na conta GitHub proprietária.
- Ativar SSL Enforcement e Network Restrictions para conexões diretas ao Postgres.
- Revisar Security Advisor após cada migração.
- Manter backups externos; no plano gratuito, agendar `supabase db dump` para local seguro.

## Limite inevitável do jogo atual

O combate e o PvE ainda rodam no navegador. Um jogador controla o próprio navegador e pode alterar a memória local. Por isso, o payload do cloud save é marcado como `client_unverified` e nunca deve alimentar ranking global, prêmios competitivos ou decisões ADM. Para impedir cheat competitivo de forma completa, partidas ranqueadas precisam ser validadas ou executadas por um servidor autoritativo.

