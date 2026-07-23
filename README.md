# ReduzSim Gestao

CRM interno da ReduzSim para INSS de obras, regularizacao de imoveis, tarefas,
atualizacoes, indicadores, metas e financeiro administrativo.

## Arquitetura

- Frontend estatico publicado pelo Cloudflare Pages.
- Rotas e arquivos protegidos por Cloudflare Pages Functions.
- Login por Firebase Authentication no projeto `reduzsim-2a6f2`.
- Sessao do servidor em cookie assinado, `HttpOnly`, `Secure` e
  `SameSite=Strict`.
- Dados armazenados no Cloudflare D1, separados por tipo de registro.
- GitHub usado como repositorio do codigo, sem dados operacionais.

O ambiente de producao fica em:

`https://reduzsim-gestao.pages.dev/`

O endereco anterior do GitHub Pages encaminha para o ambiente de producao.

## Desenvolvimento

Requisitos: Node.js 20 ou superior.

```text
npm ci
npm run check
npm test
npm run build
npx wrangler pages dev
```

O ambiente local exige `SESSION_SECRET` em `.dev.vars`. Esse arquivo e
ignorado pelo Git e nunca deve ser publicado.

## Banco de dados

O schema inicial esta em `migrations/0001_crm.sql`. O banco remoto configurado
em `wrangler.toml` e `reduzsim-gestao-db`.

O export do Firebase e o SQL gerado ficam em `exports/`, pasta ignorada pelo
Git:

```text
npm run prepare:import -- exports/firestore-state.json exports/d1-import.sql
npx wrangler d1 execute reduzsim-gestao-db --remote --file exports/d1-import.sql
```

Antes de importar, confira o hash e as contagens exibidas pelo gerador. Uma
fotografia final do Firebase deve ser importada imediatamente antes da troca
definitiva para evitar perda de alteracoes feitas durante a validacao.

## Publicacao

```text
npm run build
npx wrangler pages deploy dist --project-name reduzsim-gestao
```

O segredo de sessao deve ser configurado diretamente no Cloudflare e nunca em
arquivo versionado.

## Controles de seguranca

- Todo o painel e toda a API exigem sessao validada no servidor.
- Somente os dois e-mails previamente cadastrados podem vincular um UID do
  Firebase.
- Financeiro interno e categorias de contas sao retornados apenas para a
  administradora.
- Historicos existentes nao podem ser editados ou removidos pela colaboradora.
- Atualizacoes sao imutaveis; a leitura por usuario fica em tabela separada.
- Gravacoes usam versoes para impedir sobrescrita silenciosa entre
  computadores.
- A base completa nao e salva em `localStorage`.
- Respostas privadas usam `no-store`, CSP, bloqueio de iframe e `noindex`.

## Recuperacao

O ultimo backup exportado do Firebase deve ser mantido localmente como
contingencia. Em caso de incidente, o banco D1 e o historico do Git permitem
restaurar uma versao anterior sem expor os dados no repositorio.
