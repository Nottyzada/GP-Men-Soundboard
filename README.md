# GP Men Soundboard
Painel de áudio para a esquete do GP de Homens. HTML, CSS e JavaScript puros (Web Audio API + IndexedDB). Sem backend.

## Publicar no GitHub Pages
1. Envie `index.html`, `style.css`, `app.js`, `sw.js` e `README.md` para a raiz do repositório.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. Abra o link `https://SEU-USUARIO.github.io/GP-Men-Soundboard/` no Chrome.

## Biblioteca de áudio
As músicas ficam em uma biblioteca própria e podem ser escolhidas no seletor de música: **Final**, **Final +30s**, **Homem 1** e **Homem 2**. O botão `Adicionar música` permite incluir outras faixas.

Os efeitos sonoros ficam armazenados separadamente na biblioteca de efeitos. O preset inicial inclui **Homem 3** como efeito; novos efeitos podem ser importados pelo botão `Importar efeitos`.

## Preparação (com internet, antes do evento)
1. Abra o site no Chromebook, **no mesmo navegador e perfil** que usará na apresentação.
2. Carregue a música e importe os efeitos. Tudo fica salvo no navegador.
3. Recarregue a página uma vez e teste. Depois disso o site abre também sem internet.
4. Não limpe os dados de navegação nem use janela anônima (os áudios seriam apagados).

## Atalhos
Espaço: Play/Pause da música · Esc: parar tudo · 1–9: efeitos (ordem da grade)

Dica: ao tocar um efeito que já está tocando, ele recomeça do início.

## Áudios já incluídos (pasta `sounds/`)
Na primeira abertura com internet, o site salva automaticamente no navegador as quatro músicas e o efeito Homem 3. Para trocar ou adicionar arquivos, use os controles das respectivas seções.
