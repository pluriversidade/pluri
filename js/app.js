/* ═══════════════════════════════════════════════════════════════════════════
   O FUNCIONAMENTO DA PÁGINA
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* -------------------------------------------------------------------------
     MODO EDIÇÃO / LOCAL
     ------------------------------------------------------------------------- */
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

  /* -------------------------------------------------------------------------
     VERIFICAÇÃO DE ARQUIVOS DE DADOS
     ------------------------------------------------------------------------- */
  var temTextos    = existe("TEXTOS",        window.TEXTOS,        "js/dados-textos.js");
  var temContatos  = existe("CONTATOS",      window.CONTATOS,      "js/dados-textos.js");
  var temGrupos    = existe("GRUPOS",        window.GRUPOS,        "js/dados-grupos.js");
  var temCategorias= existe("CATEGORIAS",    window.CATEGORIAS,    "js/dados-grupos.js");
  var temFestas    = existe("FESTAS",        window.FESTAS,        "js/dados-festas.js");
  var temUnis      = existe("UNIVERSIDADES", window.UNIVERSIDADES, "js/dados-festas.js");
  var temParceiros = existe("PARCEIROS",     window.PARCEIROS,     "js/dados-parceiros.js");

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

  /* -------------------------------------------------------------------------
     FUNÇÕES UTILITÁRIAS
     ------------------------------------------------------------------------- */
  function dois(n) { return n < 10 ? "0" + n : String(n); }

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
    return String(texto || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugify(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* -------------------------------------------------------------------------
     FILTRAGEM INICIAL DE DADOS VÁLIDOS
     ------------------------------------------------------------------------- */
  var gruposBons = grupos.filter(function (g) {
    return g && g.nome && pareceLink(g.url) && categorias[g.cat];
  });

  var festasBoas = festas.filter(function (f) {
    return f && f.titulo && partesDaData(f.data) && (window.UNIVERSIDADES || {})[f.uni];
  });

  var parceirosBons = parceiros.filter(function (p) {
    return p && p.nome && pareceLink(p.link);
  });

  /* -------------------------------------------------------------------------
     CONFIGURAR BOTÃO DE PIX
     ------------------------------------------------------------------------- */
  function configurarPix() {
    var botaoPix = document.getElementById("copiar-pix");
    var pixNumero = document.getElementById("pix-numero");
    var pixRotulo = document.getElementById("pix-rotulo");

    var chavePix = (contatos && contatos.pix) ? contatos.pix : (window.CHAVE_PIX || "pix@pluri.com");

    if (pixNumero) {
      pixNumero.textContent = chavePix;
    }

    if (botaoPix) {
      botaoPix.addEventListener("click", function () {
        navigator.clipboard.writeText(chavePix).then(function () {
          if (pixRotulo) {
            var original = pixRotulo.textContent;
            pixRotulo.textContent = "Chave copiada!";
            setTimeout(function () {
              pixRotulo.textContent = original;
            }, 2500);
          }
        }).catch(function (err) {
          console.error("Erro ao copiar Pix: ", err);
        });
      });
    }
  }

  /* -------------------------------------------------------------------------
     PAGINAÇÃO REUTILIZÁVEL
     ------------------------------------------------------------------------- */
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
      irParaPagina: function (num) { pagina = num; },
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

  /* -------------------------------------------------------------------------
     TEXTOS DINÂMICOS NA TELA E ANIMAÇÃO OLA DE TORCIDA
     ------------------------------------------------------------------------- */
  function aplicarTextos() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-texto]"), function (el) {
      var chave = el.getAttribute("data-texto");
      if (typeof textos[chave] === "string") el.textContent = textos[chave];
    });

    animarTituloOla();
  }

  function animarTituloOla() {
    var elTitulo = document.querySelector(".titulo");
    if (!elTitulo) return;

    var texto = elTitulo.textContent.trim();
    if (!texto) return;

    var html = "";
    var atrasoBase = 0.1;

    for (var i = 0; i < texto.length; i++) {
      var char = texto[i];
      if (char === " ") {
        html += "&nbsp;";
      } else {
        var delay = (i * atrasoBase).toFixed(2);
        html += '<span class="letra-ola" style="animation-delay: ' + delay + 's">' + escapar(char) + '</span>';
      }
    }

    elTitulo.innerHTML = html;
  }

  /* -------------------------------------------------------------------------
     CARROSSEL DE PARCEIROS
     ------------------------------------------------------------------------- */
  function montarParceiros() {
    var trilho = document.getElementById("parceiros");
    if (!trilho || parceirosBons.length === 0) return;

    trilho.innerHTML = parceirosBons.map(function (p) {
      var imgSrc = p.logo || p.imagem || p.foto || "";

      return (
        '<article class="parceiro">' +
          '<div class="parceiro__topo">' +
            (imgSrc ? '<img class="parceiro__logo" src="' + imgSrc + '" alt="" loading="lazy">' : '') +
            (p.selo ? '<p class="parceiro__selo">' + p.selo + '</p>' : '') +
          '</div>' +
          '<h2 class="parceiro__nome">' + p.nome + '</h2>' +
          '<p class="parceiro__chamada">' + (p.chamada || "") + '</p>' +
          '<a class="parceiro__cta" href="' + p.link + '" target="_blank" rel="noopener">' + (p.botao || "Saber mais") + '</a>' +
        '</article>'
      );
    }).join("");

    var velocidade = 4000;
    var intervalo = null;

    function rolarProximo() {
      if (trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 10) {
        trilho.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        trilho.scrollBy({ left: 292, behavior: 'smooth' });
      }
    }

    function ligarCarrossel() {
      if (!intervalo) {
        intervalo = setInterval(rolarProximo, velocidade);
      }
    }

    function desligarCarrossel() {
      if (intervalo) {
        clearInterval(intervalo);
        intervalo = null;
      }
    }

    ligarCarrossel();
    trilho.addEventListener("mouseenter", desligarCarrossel);
    trilho.addEventListener("mouseleave", ligarCarrossel);
  }

  /* -------------------------------------------------------------------------
     SEÇÃO DE FESTAS (INDEX)
     ------------------------------------------------------------------------- */
  var paginasFestas;

  function montarFestas() {
    var lista = document.getElementById("festas-lista");
    if (!lista) return 0;

    var selEstadoFesta = document.getElementById("select-estado-festas");
    var selCidadeFesta = document.getElementById("select-cidade-festas");
    var selUniFesta    = document.getElementById("select-uni-festas");
    var buscaFesta     = document.getElementById("festas-dia");

    var estadosData = window.ESTADOS || {};
    var cidadesData = window.CIDADES || {};
    var unisData    = window.UNIVERSIDADES || {};

    function simples(texto) {
      return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    var estadoSel = Object.keys(estadosData).find(function(k) {
      return k === "MG" || simples(k) === "mg" || simples(estadosData[k].nome) === "minas gerais";
    }) || "MG";

    var cidadeSel = Object.keys(cidadesData).find(function(k) {
      return k === "bh" || simples(k) === "bh" || simples(cidadesData[k].nome) === "belo horizonte";
    }) || "bh";

    var uniSel = Object.keys(unisData).find(function(k) {
      return k === "ufmg" || simples(k) === "ufmg" || simples(unisData[k].nome) === "ufmg";
    }) || "ufmg";

    var dataFiltroSel = "";

    paginasFestas = fazerPaginas({
      caixa: "festas-paginas", voltar: "festas-voltar", avancar: "festas-avancar", onde: "festas-onde"
    }, function () { desenhar(); });

    function renderEstadosFesta() {
      if (!selEstadoFesta) return;
      selEstadoFesta.innerHTML = '<option value="">Selecione o Estado</option>' +
        Object.keys(estadosData).map(function (key) {
          return '<option value="' + key + '">' + estadosData[key].nome + '</option>';
        }).join("");
      selEstadoFesta.value = estadoSel;
    }

    function atualizarSelectCidadesFesta() {
      if (!selCidadeFesta) return;
      if (!estadoSel) {
        selCidadeFesta.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
        selCidadeFesta.disabled = true;
        cidadeSel = "";
        return;
      }

      var cidadesFiltradas = Object.keys(cidadesData).filter(function (key) {
        return cidadesData[key].estado === estadoSel;
      });

      selCidadeFesta.innerHTML = '<option value="">Todas as Cidades</option>' +
        cidadesFiltradas.map(function (key) {
          return '<option value="' + key + '">' + cidadesData[key].nome + '</option>';
        }).join("");

      selCidadeFesta.disabled = false;
      selCidadeFesta.value = cidadeSel;
    }

    function atualizarSelectUnisFesta() {
      if (!selUniFesta) return;
      if (!estadoSel) {
        selUniFesta.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
        selUniFesta.disabled = true;
        uniSel = "";
        return;
      }

      var unisFiltradas = Object.keys(unisData).filter(function (key) {
        var u = unisData[key];
        var c = cidadesData[u.cidade];
        var bateEstado = !estadoSel || (c && c.estado === estadoSel);
        var bateCidade = !cidadeSel || u.cidade === cidadeSel;
        return bateEstado && bateCidade;
      });

      selUniFesta.innerHTML = '<option value="">Todas as Universidades</option>' +
        unisFiltradas.map(function (key) {
          return '<option value="' + key + '">' + unisData[key].nome + '</option>';
        }).join("");

      selUniFesta.disabled = false;
      selUniFesta.value = uniSel;
    }

    if (selEstadoFesta) {
      selEstadoFesta.addEventListener("change", function () {
        estadoSel = selEstadoFesta.value;
        cidadeSel = "";
        uniSel = "";
        atualizarSelectCidadesFesta();
        atualizarSelectUnisFesta();
        paginasFestas.reiniciar();
        desenhar();
      });
    }

    if (selCidadeFesta) {
      selCidadeFesta.addEventListener("change", function () {
        cidadeSel = selCidadeFesta.value;
        uniSel = "";
        atualizarSelectUnisFesta();
        paginasFestas.reiniciar();
        desenhar();
      });
    }

    if (selUniFesta) {
      selUniFesta.addEventListener("change", function () {
        uniSel = selUniFesta.value;
        paginasFestas.reiniciar();
        desenhar();
      });
    }

    if (buscaFesta) {
      buscaFesta.addEventListener("change", function () {
        dataFiltroSel = buscaFesta.value;
        var btnLimpar = document.getElementById("festas-limpar");
        if (btnLimpar) btnLimpar.hidden = !dataFiltroSel;
        paginasFestas.reiniciar();
        desenhar();
      });
    }

    var btnLimparData = document.getElementById("festas-limpar");
    if (btnLimparData) {
      btnLimparData.addEventListener("click", function () {
        if (buscaFesta) buscaFesta.value = "";
        dataFiltroSel = "";
        btnLimparData.hidden = true;
        paginasFestas.reiniciar();
        desenhar();
      });
    }

    function diasFaltam(iso) {
      var p = partesDaData(iso);
      if (!p) return "";
      var dFesta = new Date(p.ano, p.mes - 1, p.dia);
      var dHoje = new Date();
      dHoje.setHours(0, 0, 0, 0);
      dFesta.setHours(0, 0, 0, 0);
      var diff = Math.round((dFesta - dHoje) / (1000 * 60 * 60 * 24));
      if (diff < 0) return "passou";
      if (diff === 0) return "hoje";
      if (diff === 1) return "amanhã";
      return "faltam " + diff + " dias";
    }

    function desenhar() {
      var visiveis = festasBoas.filter(function (f) {
        var uniDaFesta = unisData[f.uni];
        var cidDaFesta = uniDaFesta ? cidadesData[uniDaFesta.cidade] : null;

        var bateEstado = !estadoSel || (cidDaFesta && cidDaFesta.estado === estadoSel);
        var bateCidade = !cidadeSel || (uniDaFesta && uniDaFesta.cidade === cidadeSel);
        var bateUni = !uniSel || f.uni === uniSel || simples(f.uni) === simples(uniSel);
        var bateData = !dataFiltroSel || f.data === dataFiltroSel;

        return bateEstado && bateCidade && bateUni && bateData;
      });

      lista.innerHTML = paginasFestas.recortar(visiveis).map(function (f) {
        var d = partesDaData(f.data);
        var u = unisData[f.uni] || { nome: f.uni || "" };
        var corFesta = f.cor || "var(--terracota)";
        var faltam = diasFaltam(f.data);
        var slugFesta = slugify(f.titulo);

        var temMidia = Boolean(f.midia);
        var ehVideo = temMidia && /\.(mp4|webm|ogg)$/i.test(f.midia);

        var miniHtml = "";
        if (temMidia) {
          if (ehVideo) {
            miniHtml =
              '<div class="festa__mini-container" data-midia="' + f.midia + '" data-tipo="video">' +
                '<video class="festa__mini-media" src="' + f.midia + '#t=0.5" muted playsinline preload="metadata"></video>' +
                '<span class="festa__play-icon">▶</span>' +
              '</div>';
          } else {
            miniHtml =
              '<div class="festa__mini-container" data-midia="' + f.midia + '" data-tipo="imagem">' +
                '<img class="festa__mini-media" src="' + f.midia + '" alt="Flyer ' + escapar(f.titulo) + '" loading="lazy">' +
              '</div>';
          }
        }

        var DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

        var mensagemComissario = encodeURIComponent("Oi galera da Pluri*, quero ser comissário de venda de ingressos da festa *" + f.titulo + "*, como faço?");
        var linkComissario = "https://wa.me/5531991579687?text=" + mensagemComissario;

        var urlPaginaFesta = "festa.html#" + slugFesta;

        return (
          '<li class="festa" id="festa-' + slugFesta + '" style="--cor:' + corFesta + '">' +
            '<div class="festa__conteudo-principal">' +
              '<div class="festa__topo-linha">' +
                '<div class="festa__data">' +
                  '<span class="festa__semana">' + DIAS_SEMANA[d.semana] + '</span>' +
                  '<span class="festa__dia">' + dois(d.dia) + '</span>' +
                  '<span class="festa__mes">' + MESES[d.mes - 1] + '</span>' +
                  (faltam ? '<span class="festa__faltam">' + faltam + '</span>' : '') +
                '</div>' +
                '<div class="festa__corpo">' +
                  '<p class="festa__uni">' + escapar(u.nome) + (f.hora ? ' • <span class="festa__hora">' + escapar(f.hora) + '</span>' : '') + '</p>' +
                  '<h3 class="festa__titulo"><a class="festa__titulo-link" href="' + urlPaginaFesta + '">' + escapar(f.titulo) + '</a></h3>' +
                '</div>' +
              '</div>' +
              '<p class="festa__descricao">' + escapar(f.descricao || f.desc || "") + '</p>' +
              '<div class="festa__links">' +
                '<a class="festa__link" href="' + urlPaginaFesta + '">Ver Informações Completas</a>' +
                (pareceLink(f.ingresso) ? '<a class="festa__link festa__link--ingresso" href="' + f.ingresso + '" target="_blank" rel="noopener">Comprar Ingresso</a>' : '') +
                (pareceLink(f.perfil) ? '<a class="festa__link festa__link--perfil" href="' + f.perfil + '" target="_blank" rel="noopener">Instagram</a>' : '') +
                '<a class="festa__link festa__link--grupo" href="' + linkComissario + '" target="_blank" rel="noopener">Seja Comissário</a>' +
              '</div>' +
            '</div>' +
            (miniHtml ? miniHtml : '') +
            '<div class="grupo__acoes festa__acoes">' +
              '<button class="festa__btn-share btn-compartilhar-festa" type="button" data-slug="' + slugFesta + '" title="Compartilhar Festa no WhatsApp">🔗 <span class="texto-vertical">COMPARTILHAR</span></button>' +
            '</div>' +
          '</li>'
        );
      }).join("");

      var vazio = document.getElementById("festas-vazio");
      if (vazio) vazio.hidden = visiveis.length > 0;

      var contaAba = document.getElementById("aba-festas-conta");
      if (contaAba) contaAba.textContent = visiveis.length;

      Array.prototype.forEach.call(document.querySelectorAll(".festa__mini-container"), function (elem) {
        elem.addEventListener("click", function () {
          var midiaSrc = elem.getAttribute("data-midia");
          var tipo = elem.getAttribute("data-tipo");
          abrirModalMidia(midiaSrc, tipo);
        });
      });

      Array.prototype.forEach.call(document.querySelectorAll(".btn-compartilhar-festa"), function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var slug = btn.getAttribute("data-slug");
          var urlCard = location.origin + location.pathname.replace("index.html", "") + "festa.html#" + slug;

          var f = festasBoas.find(function (festa) {
            return slugify(festa.titulo) === slug;
          });

          if (!f) return;

          var d = partesDaData(f.data);
          var dataFormatada = d ? dois(d.dia) + "/" + dois(d.mes) + "/" + d.ano : f.data;
          var horaFormatada = f.hora ? " às " + f.hora : "";
          var descricaoFesta = f.descricao || f.desc || "";

          var linhaIngresso = pareceLink(f.ingresso)
            ? "\n\n*Comprar ingresso:* " + f.ingresso
            : "";

          var mensagemComissario = encodeURIComponent("*Oi galera da Pluri*, quero ser comissário de venda de ingressos da festa *" + f.titulo + "*, como faço?");
          var linkComissario = "https://wa.me/5531991579687?text=" + mensagemComissario;
          var linhaRevenda = "\n\n*Revenda ingressos da festa:* " + linkComissario;

          var textoCompartilhamento =
            "*Ei*, achei essa festa e resolvi *compartilhar* a informação útil!\n" +
            urlCard + "\n\n" +
            "*" + f.titulo.toUpperCase() + "*\n" +
            "*" + dataFormatada + "*" + horaFormatada +
            (descricaoFesta ? "\n\n" + descricaoFesta : "") +
            linhaIngresso +
            linhaRevenda + "\n\n" +
            "*Pluriversidade.com.br*";

          var urlWhatsapp = "https://api.whatsapp.com/send?text=" + encodeURIComponent(textoCompartilhamento);
          window.open(urlWhatsapp, "_blank");
        });
      });
    }

    renderEstadosFesta();
    atualizarSelectCidadesFesta();
    atualizarSelectUnisFesta();
    desenhar();

    return festasBoas.length;
  }

  /* -------------------------------------------------------------------------
     NOVA FUNÇÃO: MONTAGEM DA PÁGINA INDIVIDUAL DA FESTA E OPEN GRAPH DINÂMICO
     ------------------------------------------------------------------------- */
  function montarDetalheFesta() {
    var container = document.getElementById("detalhe-festa-container");
    if (!container) return;

    var hash = location.hash ? location.hash.replace("#", "") : "";
    if (!hash && festasBoas.length > 0) {
      hash = slugify(festasBoas[0].titulo);
    }

    var f = festasBoas.find(function (festa) {
      return slugify(festa.titulo) === hash;
    });

    if (!f) {
      container.innerHTML = '<div class="detalhe-festa"><p>Festa não encontrada ou link inválido.</p></div>';
      return;
    }

    var d = partesDaData(f.data);
    var u = (window.UNIVERSIDADES || {})[f.uni] || { nome: f.uni || "" };
    var corFesta = f.cor || "var(--terracota)";
    var DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
    var dataFormatada = d ? dois(d.dia) + " de " + MESES[d.mes - 1] + " de " + d.ano : f.data;

    // ATUALIZAÇÃO DINÂMICA DAS METATAGS OPEN GRAPH
    var tituloPagina = f.titulo + " — Pluriversidade";
    var descPagina = f.descricao || f.desc || "Confira os detalhes desta festa universitária.";
    var imagemFlyer = (f.midia && !/\.(mp4|webm|ogg)$/i.test(f.midia)) ? location.origin + "/" + f.midia : "";

    document.title = tituloPagina;
    var metaTitle = document.getElementById("meta-title");
    var metaDesc = document.getElementById("meta-desc");
    var ogTitle = document.getElementById("og-title");
    var ogDesc = document.getElementById("og-desc");
    var ogImage = document.getElementById("og-image");

    if (metaTitle) metaTitle.textContent = tituloPagina;
    if (metaDesc) metaDesc.setAttribute("content", descPagina);
    if (ogTitle) ogTitle.setAttribute("content", tituloPagina);
    if (ogDesc) ogDesc.setAttribute("content", descPagina);
    if (ogImage && imagemFlyer) ogImage.setAttribute("content", imagemFlyer);

    var temMidia = Boolean(f.midia);
    var ehVideo = temMidia && /\.(mp4|webm|ogg)$/i.test(f.midia);
    var midiaHtml = "";

    if (temMidia) {
      if (ehVideo) {
        midiaHtml = '<video class="detalhe-festa__midia-grande" src="' + f.midia + '" controls autoplay playsinline></video>';
      } else {
        midiaHtml = '<img class="detalhe-festa__midia-grande" src="' + f.midia + '" alt="Flyer ' + escapar(f.titulo) + '">';
      }
    }

    var mensagemComissario = encodeURIComponent("Oi galera da Pluri*, quero ser comissário de venda de ingressos da festa *" + f.titulo + "*, como faço?");
    var linkComissario = "https://wa.me/5531991579687?text=" + mensagemComissario;

    container.innerHTML =
      '<article class="detalhe-festa" style="--cor:' + corFesta + '">' +
        '<p class="festa__uni">' + escapar(u.nome) + (f.hora ? ' • ' + escapar(f.hora) : '') + '</p>' +
        '<h2 class="secao__titulo" style="font-size: 1.8rem; margin: .3rem 0 .5rem;">' + escapar(f.titulo) + '</h2>' +
        '<p style="font-family: var(--mono); font-size: .9rem; color: var(--tinta-fraca); margin-bottom: 1rem;">📅 ' + dataFormatada + '</p>' +
        '<p style="font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.2rem;">' + escapar(f.descricao || f.desc || "") + '</p>' +
        midiaHtml +
        '<div class="festa__links" style="margin-top: 1.5rem;">' +
          (pareceLink(f.ingresso) ? '<a class="festa__link festa__link--ingresso" href="' + f.ingresso + '" target="_blank" rel="noopener">Comprar Ingresso</a>' : '') +
          (pareceLink(f.perfil) ? '<a class="festa__link festa__link--perfil" href="' + f.perfil + '" target="_blank" rel="noopener">Instagram da Festa</a>' : '') +
          '<a class="festa__link festa__link--grupo" href="' + linkComissario + '" target="_blank" rel="noopener">Quero ser Comissário</a>' +
        '</div>' +
      '</article>';
  }

  /* -------------------------------------------------------------------------
     SEÇÃO DE GRUPOS
     ------------------------------------------------------------------------- */
  var selecionarCategoriaExternamente = null;
  var irParaGrupoPeloSlug = null;
  var paginasGrupos;

  function montarGrupos() {
    var lista = document.getElementById("lista");
    if (!lista) return 0;

    var selEstado = document.getElementById("select-estado");
    var selCidade = document.getElementById("select-cidade");
    var selUni    = document.getElementById("select-uni");
    var busca     = document.getElementById("busca");
    var contagem  = document.getElementById("contagem");
    var divChips  = document.getElementById("chips");

    var estadoSel = "MG";
    var cidadeSel = "bh";
    var uniSel    = "ufmg";
    var catSel    = "";
    var buscaTexto= "";

    var estadosData = window.ESTADOS || {};
    var cidadesData = window.CIDADES || {};
    var unisData = window.UNIVERSIDADES || {};

    paginasGrupos = fazerPaginas({
      caixa: "grupos-paginas", voltar: "grupos-voltar", avancar: "grupos-avancar", onde: "grupos-onde"
    }, function () { desenhar(); });

    function simples(texto) {
      return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function renderEstados() {
      if (!selEstado) return;
      selEstado.innerHTML = '<option value="">Selecione o Estado</option>' +
        Object.keys(estadosData).map(function (key) {
          return '<option value="' + key + '">' + estadosData[key].nome + '</option>';
        }).join("");
      selEstado.value = estadoSel;
    }

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
        var bateEstado = !estadoSel || (c && c.estado === estadoSel);
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

    function rolarParaCards() {
      if (!divChips) return;
      var rect = divChips.getBoundingClientRect();
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var targetY = scrollTop + rect.top - 100;
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth"
      });
    }

    function montarChips() {
      if (!divChips) return;

      var html = '<div class="chip-grupo chip-grupo--todas" aria-pressed="' + (!catSel ? 'true' : 'false') + '">' +
        '<button class="chip-conteudo" type="button" data-cat="">' +
          '<span class="chip-nome" style="text-align: center; width: 100%;">Todas as Categorias</span>' +
        '</button>' +
        '</div>';

      Object.keys(categorias).forEach(function (key) {
        var cat = categorias[key];
        var ativa = catSel === key;
        var imgUrl = cat.imagem || cat.icone || cat.foto || "";

        html += '<div class="chip-grupo" aria-pressed="' + (ativa ? 'true' : 'false') + '">' +
          '<button class="chip-conteudo" type="button" data-cat="' + key + '">' +
            (imgUrl ? '<img class="chip-img" src="' + imgUrl + '" alt="" loading="lazy">' : '') +
            '<span class="chip-nome">' + escapar(cat.nome) + '</span>' +
          '</button>' +
          '<button class="btn-share-cat" type="button" data-share-cat="' + key + '" title="Compartilhar Categoria no WhatsApp">💬</button>' +
          '</div>';
      });

      divChips.innerHTML = html;

      Array.prototype.forEach.call(divChips.querySelectorAll("[data-cat]"), function (btn) {
        btn.addEventListener("click", function () {
          catSel = btn.getAttribute("data-cat") || "";
          montarChips();
          paginasGrupos.reiniciar();
          desenhar();
          if (catSel) {
            rolarParaCards();
          }
        });
      });

      Array.prototype.forEach.call(divChips.querySelectorAll("[data-share-cat]"), function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var keyCat = btn.getAttribute("data-share-cat");
          var catObj = categorias[keyCat];
          var nomeCat = catObj ? catObj.nome : keyCat;
          var urlShare = location.origin + location.pathname + "#grupos/" + keyCat;

          var nomeUni = "universidade";
          if (selUni && selUni.value && unisData[selUni.value]) {
            nomeUni = unisData[selUni.value].nome;
          }

          var textoShare = "*Ei*, encontrei os grupos da categoria *" + nomeCat + "* da *" + nomeUni + "*!\n\nConfira todos os grupos aqui:\n" + urlShare;
          var urlWhatsapp = "https://api.whatsapp.com/send?text=" + encodeURIComponent(textoShare);
          window.open(urlWhatsapp, "_blank");
        });
      });
    }

    if (selEstado) {
      selEstado.addEventListener("change", function () {
        estadoSel = selEstado.value;
        cidadeSel = "";
        uniSel = "";
        atualizarSelectCidades();
        atualizarSelectUnis();
        paginasGrupos.reiniciar();
        desenhar();
      });
    }

    if (selCidade) {
      selCidade.addEventListener("change", function () {
        cidadeSel = selCidade.value;
        uniSel = "";
        atualizarSelectUnis();
        paginasGrupos.reiniciar();
        desenhar();
      });
    }

    if (selUni) {
      selUni.addEventListener("change", function () {
        uniSel = selUni.value;
        paginasGrupos.reiniciar();
        desenhar();
      });
    }

    if (busca) {
      busca.addEventListener("input", function () {
        buscaTexto = simples(busca.value);
        paginasGrupos.reiniciar();
        desenhar();
      });
    }

    function atualizarPainel(visiveis) {
      var pGrupos = document.getElementById("painel-grupos");
      var pMembros = document.getElementById("painel-membros");
      var pMedia = document.getElementById("painel-media");

      var total = visiveis.length;
      var soma = 0;

      visiveis.forEach(function (g) {
        soma += Number(g.membros) || 0;
      });

      var media = total > 0 ? Math.round(soma / total) : 0;

      if (pGrupos) pGrupos.textContent = total;
      if (pMembros) pMembros.textContent = soma.toLocaleString("pt-BR");
      if (pMedia) pMedia.textContent = media;
    }

    function desenhar() {
      var visiveis = gruposBons.filter(function (g) {
        var catObj = categorias[g.cat];
        var uniDoGrupo = g.uni || (catObj ? catObj.uni : "");

        var uniObj = unisData[uniDoGrupo];
        var cidObj = uniObj ? cidadesData[uniObj.cidade] : null;

        var bateEstado = !estadoSel || (cidObj && cidObj.estado === estadoSel);
        var bateCidade = !cidadeSel || (uniObj && uniObj.cidade === cidadeSel);
        var bateUni = !uniSel || uniDoGrupo === uniSel || simples(uniDoGrupo) === simples(uniSel);
        var bateCat = !catSel || g.cat === catSel;

        var buscaNormalizada = simples(buscaTexto);
        var nomeNormalizado  = simples(g.nome);
        var descNormalizada  = simples(g.desc);
        var catNomeNorm      = catObj ? simples(catObj.nome) : "";

        var bateBusca = !buscaTexto ||
          nomeNormalizado.indexOf(buscaNormalizada) !== -1 ||
          descNormalizada.indexOf(buscaNormalizada) !== -1 ||
          catNomeNorm.indexOf(buscaNormalizada) !== -1;

        return bateEstado && bateCidade && bateUni && bateCat && bateBusca;
      });

      if (contagem) {
        var textoSufixo = visiveis.length === 1 ? " grupo encontrado" : " grupos encontrados";
        contagem.innerHTML = "<strong>" + visiveis.length + "</strong>" + textoSufixo;
      }

      atualizarPainel(visiveis);

      lista.innerHTML = paginasGrupos.recortar(visiveis).map(function (g) {
        var catObj = categorias[g.cat] || {};
        var corGrupo = catObj.cor || "var(--verde)";
        var ehLotado = Boolean(g.lotado);
        var ehNovo = Boolean(g.novo);
        var ehAdmin = Boolean(g.admin);
        var slugGrupo = slugify(g.nome);

        var msgSuporte = encodeURIComponent("Oi! Encontrei um problema no grupo *" + g.nome + "* (link quebrado ou lotado).");
        var linkSuporte = "https://wa.me/5531991579687?text=" + msgSuporte;

        return (
          '<li class="item" id="grupo-' + slugGrupo + '" style="--cor:' + corGrupo + '">' +
            '<div class="grupo__conteudo">' +
              '<a class="grupo" href="' + (ehLotado ? 'javascript:void(0)' : g.url) + '" ' + (ehLotado ? '' : 'target="_blank" rel="noopener"') + '>' +
                '<div class="grupo__topo-linha">' +
                  '<span class="grupo__nome">' + escapar(g.nome) + '</span>' +
                '</div>' +
                (g.desc ? '<span class="grupo__desc">' + escapar(g.desc) + '</span>' : '') +
                '<span class="grupo__meta">' +
                  '<span class="ponto"></span> ' +
                  (catObj.nome ? escapar(catObj.nome) : '') +
                  (g.membros ? ' • ' + g.membros + ' membros' : '') +
                  (ehAdmin ? ' • <span class="grupo__etiqueta-admin">ADMIN</span>' : '') +
                  (ehNovo ? ' • <span class="etiqueta etiqueta--novo">NOVO</span>' : '') +
                  (ehLotado ? ' • <span class="etiqueta etiqueta--lotado">LOTADO</span>' : '') +
                '</span>' +
              '</a>' +
              '<div class="grupo__acoes">' +
                '<button class="grupo__btn-share btn-compartilhar-grupo" type="button" data-slug="' + slugGrupo + '" title="Compartilhar Grupo no WhatsApp">💬 <span class="texto-vertical">COMPARTILHAR</span></button>' +
                '<a class="reportar" href="' + linkSuporte + '" target="_blank" rel="noopener" title="Reportar erro ou grupo lotado">⚠️ <span class="texto-vertical">REPORTAR</span></a>' +
              '</div>' +
            '</div>' +
            '<a class="grupo__btn-entrar ' + (ehLotado ? 'grupo__btn-entrar--lotado' : '') + '" href="' + (ehLotado ? 'javascript:void(0)' : g.url) + '" ' + (ehLotado ? '' : 'target="_blank" rel="noopener"') + '>' +
              (ehLotado ? 'GRUPO LOTADO' : 'ENTRAR NO GRUPO') +
            '</a>' +
          '</li>'
        );
      }).join("");

      var vazio = document.getElementById("vazio");
      if (vazio) vazio.hidden = visiveis.length > 0;

      var contaAba = document.getElementById("aba-grupos-conta");
      if (contaAba) contaAba.textContent = visiveis.length;

      Array.prototype.forEach.call(document.querySelectorAll(".btn-compartilhar-grupo"), function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var slug = btn.getAttribute("data-slug");
          var urlGrupoCard = location.origin + location.pathname + "#grupos/grupo-" + slug;

          var g = gruposBons.find(function (grp) {
            return slugify(grp.nome) === slug;
          });

          if (!g) return;

          var catObj = categorias[g.cat] || {};
          var textoCompartilhamento =
            "*Ei*, achei esse grupo e resolvi *compartilhar*!\n\n" +
            "*" + g.nome.toUpperCase() + "*\n" +
            (g.desc ? g.desc + "\n" : "") +
            "Categoria: " + (catObj.nome || "") + "\n\n" +
            "Entrar no grupo: " + g.url + "\n\n" +
            "Veja mais grupos em: " + urlGrupoCard;

          var urlWhatsapp = "https://api.whatsapp.com/send?text=" + encodeURIComponent(textoCompartilhamento);
          window.open(urlWhatsapp, "_blank");
        });
      });
    }

    renderEstados();
    atualizarSelectCidades();
    atualizarSelectUnis();
    montarChips();
    desenhar();

    selecionarCategoriaExternamente = function (catKey) {
      if (categorias[catKey]) {
        catSel = catKey;
        montarChips();
        paginasGrupos.reiniciar();
        desenhar();
        rolarParaCards();
      }
    };

    irParaGrupoPeloSlug = function (slug) {
      catSel = "";
      buscaTexto = "";
      if (busca) busca.value = "";
      montarChips();

      var idx = -1;
      var visiveis = gruposBons.filter(function (g) { return true; });

      for (var i = 0; i < visiveis.length; i++) {
        if (slugify(visiveis[i].nome) === slug) {
          idx = i;
          break;
        }
      }

      if (idx !== -1) {
        var pagTarget = Math.floor(idx / POR_PAGINA) + 1;
        paginasGrupos.irParaPagina(pagTarget);
        desenhar();

        setTimeout(function () {
          var elCard = document.getElementById("grupo-" + slug);
          if (elCard) {
            elCard.scrollIntoView({ behavior: "smooth", block: "center" });
            elCard.style.transition = "outline 0.3s ease";
            elCard.style.outline = "3px solid var(--verde)";
            setTimeout(function () { elCard.style.outline = "none"; }, 3000);
          }
        }, 300);
      }
    };

    return gruposBons.length;
  }

  /* -------------------------------------------------------------------------
     MODAIS DE MÍDIA E COMISSÁRIO
     ------------------------------------------------------------------------- */
  function abrirModalMidia(src, tipo) {
    var modal = document.getElementById("modal-midia");
    var container = document.getElementById("modal-container-midia");
    if (!modal || !container) return;

    if (tipo === "video") {
      container.innerHTML = '<video class="modal-midia__midia" src="' + src + '" controls autoplay playsinline></video>';
    } else {
      container.innerHTML = '<img class="modal-midia__midia" src="' + src + '" alt="Mídia em tamanho real">';
    }

    modal.hidden = false;
  }

  function fecharModalMidia() {
    var modal = document.getElementById("modal-midia");
    var container = document.getElementById("modal-container-midia");
    if (modal) modal.hidden = true;
    if (container) {
      var midias = container.querySelectorAll("video, audio");
      Array.prototype.forEach.call(midias, function (m) {
        m.pause();
        m.src = "";
      });
      container.innerHTML = "";
    }
  }

  function pausarVideoComissario() {
    var modalComissario = document.getElementById("modal-comissario");
    if (modalComissario) {
      var videos = modalComissario.querySelectorAll("video");
      Array.prototype.forEach.call(videos, function (v) {
        v.pause();
        v.currentTime = 0;
      });
    }
  }

  function configurarModais() {
    var btnFecharMidia = document.getElementById("modal-fechar");
    var modalMidia = document.getElementById("modal-midia");

    if (btnFecharMidia) btnFecharMidia.addEventListener("click", fecharModalMidia);
    if (modalMidia) {
      modalMidia.addEventListener("click", function (e) {
        if (e.target === modalMidia) fecharModalMidia();
      });
    }

    var btnComissarioInfo = document.getElementById("btn-comissario-info");
    var modalComissario = document.getElementById("modal-comissario");
    var btnFecharComissario = document.getElementById("modal-comissario-fechar");

    pausarVideoComissario();

    if (btnComissarioInfo && modalComissario) {
      btnComissarioInfo.addEventListener("click", function () {
        modalComissario.hidden = false;
      });
    }

    if (btnFecharComissario && modalComissario) {
      btnFecharComissario.addEventListener("click", function () {
        modalComissario.hidden = true;
        pausarVideoComissario();
      });
    }

    if (modalComissario) {
      modalComissario.addEventListener("click", function (e) {
        if (e.target === modalComissario) {
          modalComissario.hidden = true;
          pausarVideoComissario();
        }
      });
    }
  }

  /* -------------------------------------------------------------------------
     SISTEMA DE ABAS E ROUTER (#HASH)
     ------------------------------------------------------------------------- */
  function configurarAbasERotas() {
    var abaGrupos = document.getElementById("aba-grupos");
    var abaFestas = document.getElementById("aba-festas");

    var secGrupos = document.getElementById("secao-grupos");
    var secFestas = document.getElementById("secao-festas");

    function ativarAba(abaNome) {
      if (abaNome === "festas") {
        if (abaFestas) { abaFestas.setAttribute("aria-selected", "true"); abaFestas.tabIndex = 0; }
        if (abaGrupos) { abaGrupos.setAttribute("aria-selected", "false"); abaGrupos.tabIndex = -1; }
        if (secFestas) secFestas.hidden = false;
        if (secGrupos) secGrupos.hidden = true;
      } else {
        if (abaGrupos) { abaGrupos.setAttribute("aria-selected", "true"); abaGrupos.tabIndex = 0; }
        if (abaFestas) { abaFestas.setAttribute("aria-selected", "false"); abaFestas.tabIndex = -1; }
        if (secGrupos) secGrupos.hidden = false;
        if (secFestas) secFestas.hidden = true;
      }
    }

    if (abaGrupos) {
      abaGrupos.addEventListener("click", function () {
        ativarAba("grupos");
        history.pushState(null, "", "#grupos");
      });
    }

    if (abaFestas) {
      abaFestas.addEventListener("click", function () {
        ativarAba("festas");
        history.pushState(null, "", "#festas");
      });
    }

    function lerHash() {
      var h = location.hash;
      if (h.indexOf("#festas") === 0) {
        ativarAba("festas");
        var partes = h.split("/");
        if (partes.length > 1 && partes[1] && typeof irParaFestaPeloSlug === "function") {
          irParaFestaPeloSlug(partes[1]);
        }
      } else if (h.indexOf("#grupos") === 0) {
        ativarAba("grupos");
        var partes = h.split("/");
        if (partes.length > 1 && partes[1]) {
          if (partes[1].indexOf("grupo-") === 0 && typeof irParaGrupoPeloSlug === "function") {
            irParaGrupoPeloSlug(partes[1].replace("grupo-", ""));
          } else if (typeof selecionarCategoriaExternamente === "function") {
            selecionarCategoriaExternamente(partes[1]);
          }
        }
      } else {
        ativarAba("grupos");
      }
    }

    window.addEventListener("popstate", lerHash);
    lerHash();
  }

  /* -------------------------------------------------------------------------
     INICIALIZAÇÃO GERAL
     ------------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    aplicarTextos();
    configurarPix();
    montarParceiros();
    montarGrupos();
    montarFestas();
    configurarModais();
    configurarAbasERotas();
  });

  window.montarDetalheFesta = montarDetalheFesta;

})();