# Sketch Studio — Portfólio

Landing page estática de portfólio para o **Sketch Studio** (Design Gráfico, Branding, Identidade Visual, Editorial e Ilustração Digital), feita apenas com **HTML, CSS e JavaScript puros** — sem frameworks, sem dependências externas e sem etapa de compilação.

## Estrutura do projeto

- `index.html` — Estrutura completa da landing page e modais
- `styles.css` — Estilos visuais, responsividade e modo claro/escuro
- `data.js` — Informações do estúdio, contatos e projetos do portfólio
- `logic.js` — Regras de filtragem, validação dos formulários e formatação
- `app.js` — Interatividade (tema, filtros, busca, modais, lightbox e formulários)
- `assets/` — Imagens, logotipos e PDFs estáticos

## Como publicar no GitHub Pages (sem build)

1. Suba os arquivos deste repositório para o GitHub (branch `main` ou `master`).
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch** (`main` / `(root)`) **ou** selecione **GitHub Actions** (o workflow já está pronto).
4. Em poucos segundos o site estará no ar!

## Como visualizar localmente

Você pode abrir o `index.html` diretamente no navegador ou iniciar um servidor local com Node.js:

```bash
npm run dev
```

Depois acesse `http://localhost:3000`.
