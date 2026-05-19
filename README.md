# ReduzSim - Clientes ativos

Painel interno para acompanhamento de clientes ativos da ReduzSim no fluxo de reducao de INSS de obras.

## Como abrir localmente

Abra o arquivo `index.html` no navegador.

## Como publicar no GitHub Pages

1. Crie um repositorio no GitHub.
2. Envie estes arquivos para a branch principal.
3. No GitHub, acesse `Settings > Pages`.
4. Em `Build and deployment`, selecione `Deploy from a branch`.
5. Escolha a branch principal e a pasta `/root`.
6. Salve. O GitHub vai gerar uma URL publica.

## Acessos

- E-mail: `mayssa@reduzsiminss.com.br`
- E-mail: `contato@reduzsiminss.com.br`
- Senhas gerenciadas pelo Firebase Authentication.

## Observacao importante

Esta versao usa Firebase Authentication para login e Cloud Firestore para sincronizar os dados entre computadores.
O `localStorage` continua sendo usado apenas como apoio local e migracao dos dados antigos.
