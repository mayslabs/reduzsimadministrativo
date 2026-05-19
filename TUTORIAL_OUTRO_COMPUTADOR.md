# Tutorial para continuar o projeto em outro computador

Este tutorial serve para abrir o mesmo projeto da ReduzSim em outro computador e continuar fazendo alteracoes no codigo com o Codex.

## 1. O que voce vai usar

- O site publicado fica aqui:
  https://mayslabs.github.io/reduzsimadministrativo/

- O codigo do projeto fica no GitHub:
  https://github.com/mayslabs/reduzsimadministrativo

O site publicado e o codigo sao coisas diferentes:

- O site publicado e onde voce usa o sistema.
- O repositorio do GitHub e onde ficam os arquivos para alterar o sistema.

## 2. No outro computador

1. Abra o Codex.
2. Entre na mesma conta que voce usa neste computador.
3. Abra o projeto pelo GitHub:
   https://github.com/mayslabs/reduzsimadministrativo

Se o Codex pedir para escolher uma pasta, escolha uma pasta facil de encontrar, por exemplo:

```text
Documentos\ReduzSim\reduzsimadministrativo
```

## 3. Como pedir para o Codex continuar o projeto

Depois que o repositorio estiver aberto no Codex, envie uma mensagem assim:

```text
Continue o projeto administrativo da ReduzSim neste repositorio. O site esta publicado no GitHub Pages e usa Firebase para login e sincronizacao dos dados. Quero fazer alteracoes no codigo e publicar no mesmo site.
```

Se quiser ser ainda mais especifica, envie:

```text
O repositorio e mayslabs/reduzsimadministrativo. Antes de alterar qualquer coisa, confira o status do git e leia os arquivos index.html, app.js, styles.css e README.md.
```

## 4. Arquivos principais do projeto

Os arquivos mais importantes sao:

- `index.html`: estrutura da pagina.
- `styles.css`: visual, cores, layout e responsividade.
- `app.js`: funcionamento do sistema, clientes, tarefas, login, Firebase e sincronizacao.
- `README.md`: resumo tecnico do projeto.

## 5. Como publicar alteracoes

Quando o Codex fizer alguma alteracao, peca para ele:

```text
Publique essa alteracao no GitHub Pages.
```

Ele devera:

1. Conferir os arquivos alterados.
2. Fazer commit.
3. Enviar para o GitHub com `git push`.
4. Confirmar que o GitHub Pages atualizou.

O site publicado continuara sendo:

```text
https://mayslabs.github.io/reduzsimadministrativo/
```

## 6. Firebase

O sistema usa Firebase para:

- Login dos usuarios.
- Sincronizacao dos dados entre computadores.
- Salvamento online dos clientes, tarefas, historico e demais informacoes.

Projeto Firebase:

```text
reduzsim-2a6f2
```

Usuarios oficiais:

```text
mayssa@reduzsiminss.com.br
contato@reduzsiminss.com.br
```

As senhas sao gerenciadas dentro do Firebase Authentication.

## 7. Importante sobre os dados

Agora que o site esta conectado ao Firebase, as informacoes cadastradas pelo site publicado ficam salvas online.

Para cadastrar clientes e tarefas no dia a dia, use o site publicado.

Para alterar campos, corrigir erros, mudar layout ou criar novas partes do sistema, use o Codex com o repositorio do GitHub.

## 8. Frase pronta para usar amanha

Copie e cole esta frase no Codex do outro computador:

```text
Quero continuar o projeto administrativo da ReduzSim. O repositorio e https://github.com/mayslabs/reduzsimadministrativo, o site publicado e https://mayslabs.github.io/reduzsimadministrativo/ e o sistema usa Firebase no projeto reduzsim-2a6f2. Confira o codigo atual e me ajude a continuar fazendo alteracoes e publicando no GitHub Pages.
```
