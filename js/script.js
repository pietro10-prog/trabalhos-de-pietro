// Casa do Noel: JavaScript simples para a AV2.
// Os 50 produtos estão no arquivo produtos.js.
const $ = (id) => document.getElementById(id);
const dinheiro = (valor) => valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});

// 1) Carrossel: troca os slides automaticamente e pelos botões.
const slides = document.querySelectorAll('.slide');
if (slides.length) {
  let atual = 0;
  const pontos = $('indicadores');
  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Mostrar slide ' + (i + 1));
    b.onclick = () => mostrarSlide(i);
    pontos.appendChild(b);
  });
  function mostrarSlide(i) {
    atual = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('ativo', n === atual));
    [...pontos.children].forEach((b, n) => b.classList.toggle('ativo', n === atual));
  }
  $('anterior').onclick = () => mostrarSlide(atual - 1);
  $('proximo').onclick = () => mostrarSlide(atual + 1);
  mostrarSlide(0);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
    setInterval(() => { if (!document.hidden) mostrarSlide(atual + 1); }, 5000);
}

// 2) Parallax: dois enfeites mudam de posição ao rolar.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener('scroll', () => {
    document.querySelectorAll('[data-velocidade]').forEach(el => {
      el.style.transform = `translateY(${Math.min(scrollY, 300) * Number(el.dataset.velocidade)}px)`;
    });
  }, {passive:true});
}

// 3) Som: a música começa apenas depois de um clique.
const musica = new Audio('audio/musica-natal.wav');
const sino = new Audio('audio/sino.wav');
musica.loop = true;
musica.volume = 0.15;
sino.volume = 0.2;
$('botao-musica').onclick = () => {
  if (musica.paused) musica.play().then(() => $('botao-musica').textContent = '♫ Pausar').catch(() => alert('Não foi possível tocar o som.'));
  else { musica.pause(); $('botao-musica').textContent = '♫ Som'; }
};

// 4) Cards: o forEach cria os produtos sem escrever 50 cards no HTML.
function mostrarProdutos(lista, id) {
  const area = $(id);
  if (!area) return;
  area.innerHTML = lista.map(p => `
    <article class="card">
      <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
      <div class="card-info">
        <small>${p.categoria}</small>
        <h3>${p.nome}</h3>
        <p>${p.descricao}</p>
        <strong>${dinheiro(p.preco)}</strong>
        <button type="button" data-id="${p.id}">Adicionar à sacola</button>
      </div>
    </article>`).join('') || '<p>Nenhum produto encontrado.</p>';
}
mostrarProdutos(produtos.filter(p => p.destaque).slice(0, 4), 'destaques');

// 5) Busca e filtros: aparecem os produtos que combinam com a pesquisa.
function filtrar() {
  if (!$('lista-produtos')) return;
  const texto = $('busca').value.toLowerCase();
  const categoria = $('categoria').value;
  const lista = produtos.filter(p => p.nome.toLowerCase().includes(texto) &&
    (categoria === 'todas' || p.categoria === categoria));
  if ($('ordenar').value === 'menor') lista.sort((a,b) => a.preco - b.preco);
  if ($('ordenar').value === 'maior') lista.sort((a,b) => b.preco - a.preco);
  mostrarProdutos(lista, 'lista-produtos');
  $('contador').textContent = `Mostrando ${lista.length} de ${produtos.length} produtos`;
}
if ($('lista-produtos')) {
  const url = new URLSearchParams(location.search).get('categoria');
  if (url && [...$('categoria').options].some(op => op.value === url)) $('categoria').value = url;
  ['busca', 'categoria', 'ordenar'].forEach(id => $(id).addEventListener(id === 'busca' ? 'input' : 'change', filtrar));
  filtrar();
}

// 6) Sacola: adiciona, remove, calcula o total e salva no navegador.
let sacola = [];
try { sacola = JSON.parse(localStorage.getItem('sacola-noel')) || []; } catch (e) { sacola = []; }
if (!Array.isArray(sacola)) sacola = [];
sacola = sacola.filter(id => produtos.some(p => p.id === id)).slice(0, 100);
function atualizarSacola() {
  const itens = $('itens-carrinho');
  itens.innerHTML = '';
  let total = 0;
  sacola.forEach((id, i) => {
    const p = produtos.find(p => p.id === id);
    total += p.preco;
    const linha = document.createElement('p');
    linha.className = 'item-sacola';
    linha.innerHTML = `<span>${p.nome} — ${dinheiro(p.preco)}</span><button type="button">Remover</button>`;
    linha.querySelector('button').onclick = () => { sacola.splice(i, 1); atualizarSacola(); };
    itens.appendChild(linha);
  });
  if (!sacola.length) itens.textContent = 'Sua sacola está vazia.';
  $('quantidade-carrinho').textContent = sacola.length;
  $('total-carrinho').textContent = dinheiro(total);
  try { localStorage.setItem('sacola-noel', JSON.stringify(sacola)); } catch (e) { /* navegador sem armazenamento */ }
}
function abrirSacola() { $('painel-carrinho').hidden = false; $('fundo-carrinho').hidden = false; }
function fecharSacola() { $('painel-carrinho').hidden = true; $('fundo-carrinho').hidden = true; }
document.addEventListener('click', e => {
  const botao = e.target.closest('[data-id]');
  if (!botao) return;
  if (sacola.length >= 100) return alert('Limite de 100 itens da demonstração.');
  sacola.push(Number(botao.dataset.id));
  atualizarSacola();
  sino.currentTime = 0;
  sino.play().catch(() => {});
  abrirSacola();
});
$('abrir-carrinho').onclick = abrirSacola;
$('fechar-carrinho').onclick = fecharSacola;
$('fundo-carrinho').onclick = fecharSacola;
$('limpar-carrinho').onclick = () => { sacola = []; atualizarSacola(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharSacola(); });
atualizarSacola();

// 7) Contagem regressiva: quantos dias faltam para 25 de dezembro?
function contarNatal() {
  const campos = document.querySelectorAll('#contagem');
  if (!campos.length) return;
  const agora = new Date();
  let natal = new Date(agora.getFullYear(), 11, 25);
  if (agora >= natal) natal = new Date(agora.getFullYear() + 1, 11, 25);
  const segundos = Math.floor((natal - agora) / 1000);
  campos.forEach(campo => campo.textContent = `${Math.floor(segundos / 86400)} dias, ${Math.floor(segundos / 3600) % 24}h ${Math.floor(segundos / 60) % 60}min ${segundos % 60}s`);
}
if ($('contagem')) { contarNatal(); setInterval(contarNatal, 1000); }

// 8) Formulário: verifica os dados; não envia mensagens reais.
if ($('form-contato')) $('form-contato').onsubmit = (e) => {
  e.preventDefault();
  const nome = $('nome').value.trim();
  const email = $('email').value.trim();
  const assunto = $('assunto').value.trim();
  const mensagem = $('mensagem').value.trim();
  if (!nome || !assunto || !mensagem) $('mensagem-form').textContent = 'Preencha todos os campos.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) $('mensagem-form').textContent = 'Digite um e-mail válido.';
  else { $('mensagem-form').textContent = `Obrigado, ${nome}! Validação concluída (sem envio real).`; $('form-contato').reset(); }
};

// Extras: menu no celular e ampliação das imagens da galeria.
$('botao-menu').onclick = () => {
  const aberto = $('menu').classList.toggle('aberto');
  $('botao-menu').setAttribute('aria-expanded', aberto);
};
if ($('janela-foto')) {
  document.querySelectorAll('.foto-galeria').forEach(botao => botao.onclick = () => {
    $('foto-ampliada').src = botao.dataset.foto;
    $('foto-ampliada').alt = botao.dataset.legenda;
    $('legenda-foto').textContent = botao.dataset.legenda;
    $('janela-foto').showModal();
  });
  $('fechar-foto').onclick = () => $('janela-foto').close();
}


// Neve: flocos feitos com JavaScript e animados pelo CSS.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const neve = document.createElement('div');
  neve.className = 'neve';
  neve.setAttribute('aria-hidden', 'true');
  const quantidade = window.innerWidth < 650 ? 14 : 24;
  for (let i = 0; i < quantidade; i++) {
    const floco = document.createElement('span');
    floco.className = 'floco';
    floco.textContent = '❄';
    floco.style.left = Math.random() * 100 + '%';
    floco.style.fontSize = 10 + Math.random() * 12 + 'px';
    floco.style.animationDuration = 10 + Math.random() * 12 + 's';
    floco.style.animationDelay = -Math.random() * 20 + 's';
    neve.appendChild(floco);
  }
  document.body.appendChild(neve);
}
