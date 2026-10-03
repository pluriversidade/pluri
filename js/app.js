/* ═══════════════════════════════════════════════════════════════════════════
   O FUNCIONAMENTO DA PÁGINA
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var editando =
    location.protocol === "file:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  var problemas = [];

  function reclamar(arquivo, texto) {
    problemas.push({ arquivo: arquivo, texto: texto });
  }

  function existe(nome, valor, arquivo) {
    if (typeof valor === "undefined") {
      reclamar(
        arquivo,
        "O arquivo não foi lido até o fim, então " + nome + " não existe."
      );
      return false;
    }
    return true;
  }

  var temTextos    = existe("TEXTOS",    window.TEXTOS,    "js/dados-textos.js");
  var temContatos  = existe("CONTATOS",  window.CONTATOS,  "js/dados-textos.js");
  var temGrupos    = existe("GRUPOS",    window.GRUPOS,    "js/dados-grupos.js");
  var temCategorias= existe("CATEGORIAS",window.CATEGORIAS,"js/dados-grupos.js");
  var temFestas    = existe("FESTAS",    window.FESTAS,    "js/dados-festas.js");
  var temUnis      = existe("UNIVERSIDADES", window.UNIVERSIDADES, "js/dados-festas.js");
  var temParceiros = existe("PARCEIROS", window.PARCEIROS, "js/dados-parceiros.js");

  var textos    = temTextos     ? TEXTOS        : {};
  var contatos  = temContatos   ? CONTATOS      : {};
  var grupos    = temGrupos     ? GRUPOS        : [];
  var categorias= temCategorias ? CATEGORIAS    : {};
  var festas    = temFestas     ? FESTAS        : [];
  var unis      = temUnis       ? UNIVERSIDADES : {};
  var parceiros = temParceiros  ? PARCEIROS     : [];
  var ajustes   = (typeof window.AJUSTES === "object" && AJUSTES) ? AJUSTES : {};

  var POR_PAGINA = 5;

  if (typeof ajustes.porPagina !== "undefined") {
    var pedido = Number(ajustes.porPagina);
    if (isFinite(pedido) && pedido >= 1) {
      POR_PAGINA = Math.floor(pedido);
    }
  }

  var MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  function dois(n) { return n < 10 ? "0" + n : String(n); }

  function hojeISO() {
    var d = new Date();
    return d.getFullYear() + "-" + dois(d.getMonth() + 1) + "-" + dois(d.getDate());
  }

  function partesDaData(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return null;
    var ano = Number(m[1]), mes = Number(m[2]), dia = Number(m[3]);
    var d = new Date(ano, mes - 1, dia);
    if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
    return { ano: ano, mes: mes, dia: dia, semana: d.getDay() };
  }

  function pareceLink(url) {
    return typeof url === "string" && /^https?:\/\/.+/.test(url.trim());
  }

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var gruposBons = grupos.filter(function (g) {
    return g && g.nome && pareceLink(g.url) && categorias[g.cat];
  });

  var festasBoas = festas.filter(function (f) {
    return f && f.titulo && partesDaData(f.data) && unis[f.uni];
  });

  var parceirosBons = parceiros.filter(function (p) {
    return p && p.nome && pareceLink(p.link);
  });

  function mostrarProblemas() {
    var caixa = document.getElementById("diagnostico");
    if (!caixa || !editando || problemas.length === 0) return;
    var html = "<strong>" + problemas.length + " coisas para arrumar</strong><ul>";
    problemas.forEach(function (p) { html += "<li>" + p.texto + "</li>"; });
    html += "</ul>";
    caixa.innerHTML = html;
    caixa.hidden = false;
  }

  /* PAGINAÇÃO */
  function fazerPaginas(nomes, redesenhar) {
    var caixa = document.getElementById(nomes.caixa);
    var voltar = document.getElementById(nomes.voltar);
    var avancar = document.getElementById(nomes.avancar);
    var onde = document.getElementById(nomes.onde);
    var pagina = 1;

    function andar(quanto) {
      pagina += quanto;
      redesenhar();
    }

    if (voltar) voltar.addEventListener("click", function () { andar(-1); });
    if (avancar) avancar.addEventListener("click", function () { andar(1); });

    return {
      reiniciar: function () { pagina = 1; },
      recortar: function (itens) {
        var ultima = Math.max(1, Math.ceil(itens.length / POR_PAGINA));
        if (pagina > ultima) pagina = ultima;
        if (pagina < 1) pagina = 1;

        if (caixa) caixa.hidden = itens.length <= POR_PAGINA;
        if (voltar) voltar.disabled = pagina <= 1;
        if (avancar) avancar.disabled = pagina >= ultima;
        if (onde) onde.textContent = "página " + pagina + " de " + ultima;

        return itens.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
      }
    };
  }

  function aplicarTextos() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-texto]"), function (el) {
      var chave = el.getAttribute("data-texto");
      if (typeof textos[chave] === "string") el.textContent = textos[chave];
    });
  }

  function montarParceiros() {
    var trilho = document.getElementById("parceiros");
    if (!trilho || parceirosBons.length === 0) return;

    trilho.innerHTML = parceirosBons.map(function (p) {
      return (
        '<article class="parceiro">' +
          '<h2 class="parceiro__nome">' + p.nome + '</h2>' +
          '<p class="parceiro__chamada">' + (p.chamada || "") + '</p>' +
          '<a class="parceiro__cta" href="' + p.link + '" target="_blank" rel="noopener">' + (p.botao || "Saber mais") + '</a>' +
        '</article>'
      );
    }).join("");
  }

  function montarFestas() {
    var lista = document.getElementById("festas-lista");
    if (!lista) return 0;

    var paginas = fazerPaginas({
      caixa: "festas-paginas", voltar: "festas-voltar", avancar: "festas-avancar", onde: "festas-onde"
    }, function () { desenhar(); });

    function desenhar() {
      var visiveis = festasBoas;
      lista.innerHTML = paginas.recortar(visiveis).map(function (f) {
        var d = partesDaData(f.data);
        var u = unis[f.uni];
        return '<li class="festa"><h3 class="festa__titulo">' + f.titulo + '</h3><p>' + u.nome + ' - ' + d.dia + '/' + MESES[d.mes - 1] + '</p></li>';
      }).join("");
    }

    desenhar();
    return festasBoas.length;
  }

  /* MONTAGEM DOS GRUPOS E FILTROS HIERÁRQUICOS */
  function montarGrupos() {
    var lista = document.getElementById("lista");
    var vazio = document.getElementById("vazio");
    var contagem = document.getElementById("contagem");
    var busca = document.getElementById("busca");
    var chips = document.getElementById("chips");

    var selEstado = document.getElementById("select-estado");
    var selCidade = document.getElementById("select-cidade");
    var selUni = document.getElementById("select-uni");

    if (!lista) return 0;

    // Valores padrão desejados
    var estadoSel = "MG";
    var cidadeSel = "bh";
    var uniSel = "ufmg";
    var filtroCat = "todos";
    var termo = "";

    var estadosData = window.ESTADOS || {};
    var cidadesData = window.CIDADES || {};
    var unisData = window.UNIVERSIDADES_GRUPOS || {};

    var paginas = fazerPaginas({
      caixa: "grupos-paginas", voltar: "grupos-voltar", avancar: "grupos-avancar", onde: "grupos-onde", topo: "grupos-titulo"
    }, function () { desenhar(); });

    function simples(texto) {
      return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function comPonto(n) { return n.toLocaleString("pt-BR"); }

    /* Popula Estados */
    function renderEstados() {
      if (!selEstado) return;
      selEstado.innerHTML = '<option value="">Selecione o Estado</option>' +
        Object.keys(estadosData).map(function (key) {
          return '<option value="' + key + '">' + estadosData[key].nome + '</option>';
        }).join("");
      selEstado.value = estadoSel;
    }

    /* Popula Cidades */
    function atualizarSelectCidades() {
      if (!selCidade) return;
      if (!estadoSel) {
        selCidade.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
        selCidade.disabled = true;
        cidadeSel = "";
        return;
      }

      var cidadesFiltradas = Object.keys(cidadesData).filter(function (key) {
        return cidadesData[key].estado === estadoSel;
      });

      selCidade.innerHTML = '<option value="">Todas as Cidades</option>' +
        cidadesFiltradas.map(function (key) {
          return '<option value="' + key + '">' + cidadesData[key].nome + '</option>';
        }).join("");

      selCidade.disabled = false;
      selCidade.value = cidadeSel;
    }

    /* Popula Universidades */
    function atualizarSelectUnis() {
      if (!selUni) return;
      if (!estadoSel) {
        selUni.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
        selUni.disabled = true;
        uniSel = "";
        return;
      }

      var unisFiltradas = Object.keys(unisData).filter(function (key) {
        var u = unisData[key];
        var c = cidadesData[u.cidade];
        var bateEstado = c && c.estado === estadoSel;
        var bateCidade = !cidadeSel || u.cidade === cidadeSel;
        return bateEstado && bateCidade;
      });

      selUni.innerHTML = '<option value="">Todas as Universidades</option>' +
        unisFiltradas.map(function (key) {
          return '<option value="' + key + '">' + unisData[key].nome + '</option>';
        }).join("");

      selUni.disabled = false;
      selUni.value = uniSel;
    }

    /* Eventos de alteração dos selects */
    if (selEstado) {
      selEstado.addEventListener("change", function () {
        estadoSel = selEstado.value;
        cidadeSel = "";
        uniSel = "";
        atualizarSelectCidades();
        atualizarSelectUnis();
        paginas.reiniciar();
        desenhar();
      });
    }

    if (selCidade) {
      selCidade.addEventListener("change", function () {
        cidadeSel = selCidade.value;
        uniSel = "";
        atualizarSelectUnis();
        paginas.reiniciar();
        desenhar();
      });
    }

    if (selUni) {
      selUni.addEventListener("change", function () {
        uniSel = selUni.value;
        paginas.reiniciar();
        desenhar();
      });
    }

    function cartao(g) {
      var c = categorias[g.cat] || { nome: "Geral", cor: "#2E7D53" };
      var u = unisData[g.uni] || { nome: "" };
      var membros = g.membros ? comPonto(g.membros) + " membros" : "";

      var desc = g.desc ? '<span class="grupo__desc">' + escapar(g.desc) + "</span>" : "";
      var onde = '<span class="grupo__onde">' + (u.nome ? u.nome + " · " : "") + escapar(c.nome) + (membros ? " · " + membros : "") + "</span>";

      return (
        '<li class="item" style="--cor:' + c.cor + '">' +
          '<a class="grupo" target="_blank" rel="noopener" href="' + g.url + '">' +
            '<span class="grupo__nome">' + escapar(g.nome) + "</span>" +
            desc +
            '<span class="grupo__meta">' + onde + "</span>" +
          "</a>" +
        "</li>"
      );
    }

    function desenhar() {
      var visiveis = gruposBons.filter(function (g) {
        var uniDoGrupo = unisData[g.uni];
        var cidDoGrupo = uniDoGrupo ? cidadesData[uniDoGrupo.cidade] : null;

        var bateEstado = !estadoSel || (cidDoGrupo && cidDoGrupo.estado === estadoSel);
        var bateCidade = !cidadeSel || (uniDoGrupo && uniDoGrupo.cidade === cidadeSel);
        var bateUni    = !uniSel || g.uni === uniSel;
        var bateCat    = filtroCat === "todos" || g.cat === filtroCat;

        var bateTermo  = termo === "" ||
          simples(g.nome).indexOf(termo) !== -1 ||
          simples(g.desc || "").indexOf(termo) !== -1;

        return bateEstado && bateCidade && bateUni && bateCat && bateTermo;
      });

      lista.innerHTML = paginas.recortar(visiveis).map(cartao).join("");
      vazio.hidden = visiveis.length > 0;

      var pessoas = visiveis.reduce(function (soma, g) {
        return soma + (typeof g.membros === "number" ? g.membros : 0);
      }, 0);

      contagem.textContent = visiveis.length === 0
        ? ""
        : visiveis.length + " grupos · " + comPonto(pessoas) + " pessoas";
    }

    /* Categorias (Chips) */
    var usadas = {};
    gruposBons.forEach(function (g) { usadas[g.cat] = true; });

    var botoes = [{ id: "todos", nome: "Todas Categorias" }].concat(
      Object.keys(categorias)
        .filter(function (id) { return usadas[id]; })
        .map(function (id) { return { id: id, nome: categorias[id].nome }; })
    );

    chips.innerHTML = botoes.map(function (b, i) {
      return '<button type="button" class="chip" data-cat="' + b.id + '"' +
             ' aria-pressed="' + (i === 0) + '">' + b.nome + "</button>";
    }).join("");

    Array.prototype.forEach.call(chips.children, function (b) {
      b.addEventListener("click", function () {
        filtroCat = b.getAttribute("data-cat");
        Array.prototype.forEach.call(chips.children, function (o) {
          o.setAttribute("aria-pressed", o === b ? "true" : "false");
        });
        paginas.reiniciar();
        desenhar();
      });
    });

    if (busca) {
      busca.addEventListener("input", function () {
        termo = simples(busca.value.trim());
        paginas.reiniciar();
        desenhar();
      });
    }

    // Inicialização da interface na ordem correta
    renderEstados();
    atualizarSelectCidades();
    atualizarSelectUnis();
    desenhar();

    return gruposBons.length;
  }

  function montarAbas() {
    var botaoGrupos = document.getElementById("aba-grupos");
    var botaoFestas = document.getElementById("aba-festas");
    var secaoGrupos = document.getElementById("secao-grupos");
    var secaoFestas = document.getElementById("secao-festas");

    if (!botaoGrupos || !botaoFestas) return;

    function mostrar(id) {
      var ehGrupos = id === "grupos";
      botaoGrupos.setAttribute("aria-selected", ehGrupos ? "true" : "false");
      botaoFestas.setAttribute("aria-selected", !ehGrupos ? "true" : "false");
      if (secaoGrupos) secaoGrupos.hidden = !ehGrupos;
      if (secaoFestas) secaoFestas.hidden = ehGrupos;
    }

    botaoGrupos.addEventListener("click", function () { mostrar("grupos"); });
    botaoFestas.addEventListener("click", function () { mostrar("festas"); });
  }

  function montarPainel() {
    var elGrupos = document.getElementById("painel-grupos");
    var elMembros = document.getElementById("painel-membros");
    var elMedia = document.getElementById("painel-media");
    if (!elGrupos) return;

    var comNumero = gruposBons.filter(function (g) { return typeof g.membros === "number" && g.membros > 0; });
    var total = comNumero.reduce(function (s, g) { return s + g.membros; }, 0);
    var media = comNumero.length ? Math.round(total / comNumero.length) : 0;

    elGrupos.textContent = gruposBons.length.toLocaleString("pt-BR");
    elMembros.textContent = total.toLocaleString("pt-BR");
    elMedia.textContent = media.toLocaleString("pt-BR");
  }

  aplicarTextos();
  montarParceiros();
  montarFestas();
  montarGrupos();
  montarAbas();
  montarPainel();
  mostrarProblemas();
})();