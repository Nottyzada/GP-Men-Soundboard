# GP Men Soundboard
Painel de áudio para a esquete do GP de Homens. HTML, CSS e JavaScript puros (Web Audio API + IndexedDB). Sem backend.

## Publicar no GitHub Pages
1. Envie `index.html`, `style.css`, `app.js`, `sw.js` e `README.md` para a raiz do repositório.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. Abra o link `https://SEU-USUARIO.github.io/GP-Men-Soundboard/` no Chrome.

## Preparação (com internet, antes do evento)
1. Abra o site no Chromebook, **no mesmo navegador e perfil** que usará na apresentação.
2. Carregue a música e importe os efeitos. Tudo fica salvo no navegador.
3. Recarregue a página uma vez e teste. Depois disso o site abre também sem internet.
4. Não limpe os dados de navegação nem use janela anônima (os áudios seriam apagados).

## Atalhos
Espaço: Play/Pause da música · Esc: parar tudo · 1–9: efeitos (ordem da grade)

Dica: ao tocar um efeito que já está tocando, ele recomeça do início.

## Áudios já incluídos (pasta `sounds/`)
Na primeira abertura com internet, o site salva automaticamente no navegador:
Música de fundo = Final · Tecla 1 = Homem 1 · 2 = Homem 2 · 3 = Homem 3 · 4 = Final +30s
Para trocar, use os botões de carregar/remover na tela.
