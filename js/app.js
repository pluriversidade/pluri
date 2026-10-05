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

  var festasBoas = [];

  var parceirosBons = parceiros.filter(function (p) {
    return p && p.nome && pareceLink(p.link);
  });

  /* -------------------------------------------------------------------------
     DIAGNOSTICO DE ERROS DE PREENCHIMENTO
     ------------------------------------------------------------------------- */
  function mostrarProblemas() {
    var caixa = document.getElementById("diagnostico");
    if (!caixa || !editando || problemas.length === 0) return;
    var html = "<strong>" + problemas.length + " coisas para arrumar</strong><ul>";
    problemas.forEach(function (p) { html += "<li>" + p.texto + "</li>"; });
    html += "</ul>";
    caixa.innerHTML = html;
    caixa.hidden = false;
  }

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
     TEXTOS DINÂMICOS NA TELA
     ------------------------------------------------------------------------- */
  function aplicarTextos() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-texto]"), function (el) {
      var chave = el.getAttribute("data-texto");
      if (typeof textos[chave] === "string") el.textContent = textos[chave];
    });
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
     SEÇÃO DE FESTAS
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

    festasBoas = festas.filter(function (f) {
      return f && f.titulo && partesDaData(f.data) && unisData[f.uni];
    });

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
                '<video class="festa__mini-media" src="' + f.midia + '" muted preload="metadata"></video>' +
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

        return (
          '<li class="festa" id="festa-' + slugFesta + '" style="--cor:' + corFesta + '">' +
            '<div class="festa__data">' +
              '<span class="festa__semana">' + DIAS_SEMANA[d.semana] + '</span>' +
              '<span class="festa__dia">' + dois(d.dia) + '</span>' +
              '<span class="festa__mes">' + MESES[d.mes - 1] + '</span>' +
              (faltam ? '<span class="festa__faltam">' + faltam + '</span>' : '') +
            '</div>' +
            '<div class="festa__corpo">' +
              '<p class="festa__uni">' + escapar(u.nome) + (f.hora ? ' • <span class="festa__hora">' + escapar(f.hora) + '</span>' : '') + '</p>' +
              '<h3 class="festa__titulo">' + escapar(f.titulo) + '</h3>' +
              '<p class="festa__descricao">' + escapar(f.descricao || f.desc || "") + '</p>' +
              '<div class="festa__links">' +
                (pareceLink(f.ingresso) ? '<a class="festa__link festa__link--ingresso" href="' + f.ingresso + '" target="_blank" rel="noopener">Comprar Ingresso</a>' : '') +
                (pareceLink(f.perfil) ? '<a class="festa__link festa__link--perfil" href="' + f.perfil + '" target="_blank" rel="noopener">Instagram</a>' : '') +
                '<a class="festa__link festa__link--grupo" href="' + linkComissario + '" target="_blank" rel="noopener">Seja Comissário</a>' +
              '</div>' +
            '</div>' +
            miniHtml +
            '<div class="grupo__acoes">' +
              '<button class="festa__btn-share btn-compartilhar-festa" type="button" data-slug="' + slugFesta + '" title="Compartilhar Festa no WhatsApp">🔗</button>' +
            '</div>' +
          '</li>'
        );
      }).join("");

      var vazio = document.getElementById("festas-vazio");
      if (vazio) vazio.hidden = visiveis.length > 0;

      var contaAba = document.getElementById("aba-festas-conta");
      if (contaAba) contaAba.textContent = visiveis.length;

      Array.prototype.forEach.call(document.querySelectorAll(".btn-compartilhar-festa"), function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var slug = btn.getAttribute("data-slug");
          var urlCard = location.origin + location.pathname + "#festas/" + slug;

          var f = festasBoas.find(function (festa) {
            return slugify(festa.titulo) === slug;
          });

          if (!f) return;

          var d = partesDaData(f.data);
          var dataFormatada = d ? dois(d.dia) + "/" + dois(d.mes) + "/" + d.ano : f.data;
          var horaFormatada = f.hora ? " : " + f.hora : "";
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
            "#############\n\n" +
            "*" + f.titulo.toUpperCase() + "*\n" +
            "*" + dataFormatada + "*" + horaFormatada +
            (descricaoFesta ? "\n\n" + descricaoFesta : "") +
            linhaIngresso +
            linhaRevenda + "\n\n" +
            "*Pluriversidade.com.br*\n" +
            "31991579687 - Whatsapp\n\n" +
            "#############";

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
     SEÇÃO DE GRUPOS
     ------------------------------------------------------------------------- */
  var selecionarCategoriaExternamente = null;
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
          } else if (uniSel && unisData[uniSel]) {
            nomeUni = unisData[uniSel].nome;
          }
          var uniMaiuscula = nomeUni.toUpperCase();

          var msgTexto = "*Ei*, confira a categoria *" + nomeCat + "* que contém vários grupos do whatsapp da " + nomeUni + ", no site da *Pluriversidade*, acredito que algum desses grupos vá te interessar!:\n" +
            urlShare + "\n\n" +
            "*Faça sua parte*, ajude a promover os grupos da *" + uniMaiuscula + "* compartilhando essa mensagem em outros grupos da " + nomeUni + ".";

          var msg = encodeURIComponent(msgTexto);
          window.open("https://api.whatsapp.com/send?text=" + msg, "_blank");
        });
      });
    }

    selecionarCategoriaExternamente = function (keyCat) {
      catSel = keyCat || "";
      montarChips();
      paginasGrupos.reiniciar();
      desenhar();
      if (catSel) {
        setTimeout(function () {
          rolarParaCards();
        }, 300);
      }
    };

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

    function desenhar() {
      var visiveis = gruposBons.filter(function (g) {
        var uniDoGrupo = unisData[g.uni];
        var cidDoGrupo = uniDoGrupo ? cidadesData[uniDoGrupo.cidade] : null;

        var bateEstado = !estadoSel || (cidDoGrupo && cidDoGrupo.estado === estadoSel);
        var bateCidade = !cidadeSel || (uniDoGrupo && uniDoGrupo.cidade === cidadeSel);
        var bateUni = !uniSel || g.uni === uniSel || simples(g.uni) === simples(uniSel);
        var bateCat = !catSel || g.cat === catSel;

        var bateBusca = !buscaTexto ||
          simples(g.nome).indexOf(buscaTexto) !== -1 ||
          simples(g.desc).indexOf(buscaTexto) !== -1;

        return bateEstado && bateCidade && bateUni && bateCat && bateBusca;
      });

      lista.innerHTML = paginasGrupos.recortar(visiveis).map(function (g) {
        var cat = categorias[g.cat] || {};
        var corCat = cat.cor || "var(--verde)";
        var slugGrupo = slugify(g.nome);

        /* Identificação de Universidade e Cidade */
        var uniObj = unisData[g.uni] || {};
        var nomeUni = uniObj.nome || g.uni || "Não informada";
        var cidObj = uniObj.cidade ? cidadesData[uniObj.cidade] : null;
        var nomeCidade = cidObj ? cidObj.nome : "Não informada";

        /* Link direto para o card do grupo específico */
        var urlCard = location.origin + location.pathname + "#grupos/" + slugGrupo;

        /* Mensagem de reporte incluindo o link direto do card do grupo */
        var suporteBase = contatos.suporte || "https://wa.me/5531991579687";
        var textoReport = "Olá, o grupo '" + g.nome + "' (Universidade: " + nomeUni + " - " + nomeCidade + ") está com problemas ou com link quebrado/lotado.\nLink do card: " + urlCard;
        var msgReport = encodeURIComponent(textoReport);
        var linkReport = "";

        if (suporteBase.indexOf("text=") !== -1) {
          linkReport = suporteBase;
        } else if (suporteBase.indexOf("?") !== -1) {
          linkReport = suporteBase + "&text=" + msgReport;
        } else {
          linkReport = suporteBase + "?text=" + msgReport;
        }

        return (
          '<li class="item" id="grupo-' + slugGrupo + '" style="--cor:' + corCat + '">' +
            '<a class="grupo" href="' + g.url + '" target="_blank" rel="noopener">' +
              '<div class="grupo__topo-linha">' +
                '<span class="grupo__nome">' + escapar(g.nome) + '</span>' +
                (g.lotado ? '<span class="etiqueta etiqueta--lotado">lotado</span>' : '') +
              '</div>' +
              (g.desc ? '<span class="grupo__desc">' + escapar(g.desc) + '</span>' : '') +
              '<div class="grupo__meta">' +
                '<span class="ponto"></span>' +
                '<span>' + escapar(cat.nome || g.cat) + '</span>' +
                (g.membros ? '<span>• ' + g.membros + ' membros</span>' : '') +
                (g.admin ? '<span class="grupo__etiqueta-admin">Oficial</span>' : '') +
              '</div>' +
            '</a>' +
            '<div class="grupo__acoes">' +
              '<button class="grupo__btn-share btn-compartilhar-grupo" type="button" data-slug="' + slugGrupo + '" title="Compartilhar Card do Grupo">🔗</button>' +
              '<a class="reportar" href="' + linkReport + '" target="_blank" rel="noopener" title="Reportar problema">⚠</a>' +
            '</div>' +
          '</li>'
        );
      }).join("");

      var vazio = document.getElementById("vazio");
      if (vazio) vazio.hidden = visiveis.length > 0;

      if (contagem) {
        contagem.textContent = visiveis.length + " grupo(s) encontrado(s)";
      }

      var contaAba = document.getElementById("aba-grupos-conta");
      if (contaAba) contaAba.textContent = visiveis.length;

      var totalMembros = 0;
      gruposBons.forEach(function (g) {
        if (g.membros) totalMembros += Number(g.membros) || 0;
      });

      var elGrupos = document.getElementById("painel-grupos");
      var elMembros = document.getElementById("painel-membros");
      var elMedia = document.getElementById("painel-media");

      if (elGrupos) elGrupos.textContent = gruposBons.length;
      if (elMembros) elMembros.textContent = totalMembros > 0 ? totalMembros.toLocaleString("pt-BR") : "—";
      if (elMedia) elMedia.textContent = gruposBons.length > 0 ? Math.round(totalMembros / gruposBons.length) : "—";

      /* Configuração dos eventos de clique para o botão Compartilhar nos cards de grupos */
      Array.prototype.forEach.call(document.querySelectorAll(".btn-compartilhar-grupo"), function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var slug = btn.getAttribute("data-slug");
          var urlCard = location.origin + location.pathname + "#grupos/" + slug;

          var g = gruposBons.find(function (grupo) {
            return slugify(grupo.nome) === slug;
          });

          if (!g) return;

          var uniObj = unisData[g.uni] || {};
          var nomeUni = uniObj.nome || g.uni || "";
          var cidObj = uniObj.cidade ? cidadesData[uniObj.cidade] : null;
          var nomeCidade = cidObj ? cidObj.nome : "";
          var descGrupo = g.desc || "";
          var qtdMembros = g.membros ? String(g.membros) : "Não informada";

          var textoCompartilhamento =
            "*Ei*, confira este grupo do Whatsapp " + (nomeUni ? "da *" + nomeUni + "*" : "") + " no site da *Pluriversidade*:\n\n" +
            "*Nome do grupo:* " + g.nome + "\n\n" +
            "*Descrição:* " + descGrupo + "\n\n" +
            "Quantidade de Membros: " + qtdMembros + "\n\n" +
            nomeUni + (nomeCidade ? " / " + nomeCidade : "") + "\n\n" +
            "Link do grupo: " + urlCard + "\n\n" +
            "Compartilhe essa mensagem em outros grupos da " + (nomeUni || "universidade") + " para que essa informação útil chegue a mais pessoas.";

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

    return gruposBons.length;
  }

  /* -------------------------------------------------------------------------
     GERENCIAMENTO DAS ABAS (GRUPOS x FESTAS) E ROLAGEM DIRETA
     ------------------------------------------------------------------------- */
  function configurarAbas() {
    var abaGrupos = document.getElementById("aba-grupos");
    var abaFestas = document.getElementById("aba-festas");
    var secGrupos = document.getElementById("secao-grupos");
    var secFestas = document.getElementById("secao-festas");

    if (!abaGrupos || !abaFestas || !secGrupos || !secFestas) return;

    function alternar(mostrarFestas, atualizarHash) {
      abaGrupos.setAttribute("aria-selected", !mostrarFestas);
      abaFestas.setAttribute("aria-selected", mostrarFestas);

      abaGrupos.tabIndex = mostrarFestas ? -1 : 0;
      abaFestas.tabIndex = mostrarFestas ? 0 : -1;

      secGrupos.hidden = mostrarFestas;
      secFestas.hidden = !mostrarFestas;

      if (atualizarHash !== false) {
        var novoHash = mostrarFestas ? "#festas" : "#grupos";
        if (location.hash !== novoHash) {
          history.replaceState(null, "", novoHash);
        }
      }
    }

    abaGrupos.addEventListener("click", function () { alternar(false); });
    abaFestas.addEventListener("click", function () { alternar(true); });

    function verificarHash() {
      var rawHash = location.hash.toLowerCase().replace(/\/$/, "");

      if (rawHash === "#festas" || rawHash.indexOf("#festas/") === 0) {
        alternar(true, false);

        if (rawHash.indexOf("#festas/") === 0) {
          var slugDesejado = rawHash.replace("#festas/", "");
          if (slugDesejado) {
            var idx = festasBoas.findIndex(function (f) { return slugify(f.titulo) === slugDesejado; });
            if (idx !== -1 && paginasFestas) {
              var pag = Math.floor(idx / POR_PAGINA) + 1;
              paginasFestas.irParaPagina(pag);
              montarFestas();
            }

            setTimeout(function () {
              var elTarget = document.getElementById("festa-" + slugDesejado);
              if (elTarget) {
                elTarget.scrollIntoView({ behavior: "smooth", block: "center" });
                var corOriginal = elTarget.style.outline;
                elTarget.style.transition = "outline 0.3s ease";
                elTarget.style.outline = "3px solid var(--cor, #e0214a)";
                setTimeout(function () {
                  elTarget.style.outline = corOriginal;
                }, 3000);
              }
            }, 300);
          }
        }
      } else {
        alternar(false, false);
        if (rawHash.indexOf("#grupos/") === 0) {
          var paramGrupo = rawHash.replace("#grupos/", "");
          if (paramGrupo) {
            // Verifica se é um card de grupo pelo slug
            var idxGrupo = gruposBons.findIndex(function (g) { return slugify(g.nome) === paramGrupo; });

            if (idxGrupo !== -1 && paginasGrupos) {
              var pagG = Math.floor(idxGrupo / POR_PAGINA) + 1;
              paginasGrupos.irParaPagina(pagG);
              montarGrupos();

              setTimeout(function () {
                var elTargetG = document.getElementById("grupo-" + paramGrupo);
                if (elTargetG) {
                  elTargetG.scrollIntoView({ behavior: "smooth", block: "center" });
                  var corOrig = elTargetG.style.outline;
                  elTargetG.style.transition = "outline 0.3s ease";
                  elTargetG.style.outline = "3px solid var(--cor, #00c853)";
                  setTimeout(function () {
                    elTargetG.style.outline = corOrig;
                  }, 3000);
                }
              }, 300);
            } else if (typeof selecionarCategoriaExternamente === "function") {
              // Se não for um slug de grupo, tenta abrir como categoria
              selecionarCategoriaExternamente(paramGrupo);
            }
          }
        }
      }
    }

    window.addEventListener("hashchange", verificarHash);
    verificarHash();
  }

  /* -------------------------------------------------------------------------
     MODAL DE MÍDIA DAS FESTAS (IMAGENS / VÍDEOS)
     ------------------------------------------------------------------------- */
  function configurarModalMidia() {
    var modal = document.getElementById("modal-midia");
    var fechar = document.getElementById("modal-fechar");
    var container = document.getElementById("modal-container-midia");

    if (!modal || !fechar || !container) return;

    document.addEventListener("click", function (e) {
      var target = e.target.closest(".festa__mini-container");
      if (!target) return;

      var src = target.getAttribute("data-midia");
      var tipo = target.getAttribute("data-tipo");

      if (!src) return;

      if (tipo === "video") {
        container.innerHTML = '<video class="modal-midia__midia" src="' + src + '" controls autoplay></video>';
      } else {
        container.innerHTML = '<img class="modal-midia__midia" src="' + src + '" alt="Flyer ampliado">';
      }

      modal.hidden = false;
    });

    function fecharModal() {
      modal.hidden = true;
      container.innerHTML = "";
    }

    fechar.addEventListener("click", fecharModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) fecharModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) fecharModal();
    });
  }

  /* -------------------------------------------------------------------------
     MODAL DO COMISSÁRIO PLURI
     ------------------------------------------------------------------------- */
  function configurarModalComissario() {
    var modal = document.getElementById("modal-comissario");
    var btnAbrir = document.getElementById("btn-comissario-info");
    var btnFechar = document.getElementById("modal-comissario-fechar");
    var video = document.getElementById("video-comissario");

    if (!modal || !btnAbrir || !btnFechar) return;

    btnAbrir.addEventListener("click", function () {
      modal.hidden = false;
      if (video) video.play();
    });

    function fecharModal() {
      modal.hidden = true;
      if (video) video.pause();
    }

    btnFechar.addEventListener("click", fecharModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) fecharModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) fecharModal();
    });
  }

  /* -------------------------------------------------------------------------
     INICIALIZAÇÃO GERAL
     ------------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    aplicarTextos();
    mostrarProblemas();
    configurarPix();
    montarParceiros();
    montarFestas();
    montarGrupos();
    configurarAbas();
    configurarModalMidia();
    configurarModalComissario();
  });
})();