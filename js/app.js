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
  var DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

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
    return String(texto)
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

  /* CONFIGURAR BOTÃO DE PIX */
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
      obterPagina: function () { return pagina; },
      definirPagina: function (p) { pagina = p; },
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

  function montarFestas() {
    var lista = document.getElementById("festas-lista");
    if (!lista) return 0;

    var selEstadoFesta = document.getElementById("select-estado-festas");
    var selCidadeFesta = document.getElementById("select-cidade-festas");
    var selUniFesta    = document.getElementById("select-uni-festas");
    var buscaFesta     = document.getElementById("festas-dia");

    var estadosData = window.ESTADOS || {};
    var cidadesData = window.CIDADES || {};
    var unisData = window.UNIVERSIDADES || {};

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

    var paginas = fazerPaginas({
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
        paginas.reiniciar();
        desenhar();
      });
    }

    if (selCidadeFesta) {
      selCidadeFesta.addEventListener("change", function () {
        cidadeSel = selCidadeFesta.value;
        uniSel = "";
        atualizarSelectUnisFesta();
        paginas.reiniciar();
        desenhar();
      });
    }

    if (selUniFesta) {
      selUniFesta.addEventListener("change", function () {
        uniSel = selUniFesta.value;
        paginas.reiniciar();
        desenhar();
      });
    }

    if (buscaFesta) {
      buscaFesta.addEventListener("change", function () {
        dataFiltroSel = buscaFesta.value;
        var btnLimpar = document.getElementById("festas-limpar");
        if (btnLimpar) btnLimpar.hidden = !dataFiltroSel;
        paginas.reiniciar();
        desenhar();
      });
    }

    var btnLimparData = document.getElementById("festas-limpar");
    if (btnLimparData) {
      btnLimparData.addEventListener("click", function () {
        if (buscaFesta) buscaFesta.value = "";
        dataFiltroSel = "";
        btnLimparData.hidden = true;
        paginas.reiniciar();
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

      var paginados = paginas.recortar(visiveis);

      if (paginados.length === 0) {
        lista.innerHTML = "";
        var vazioEl = document.getElementById("festas-vazio");
        if (vazioEl) {
          vazioEl.textContent = "Nenhuma festa encontrada para o filtro selecionado.";
          vazioEl.hidden = false;
        }
        return;
      } else {
        var vazioEl = document.getElementById("festas-vazio");
        if (vazioEl) vazioEl.hidden = true;
      }

      lista.innerHTML = paginados.map(function (f) {
        var d = partesDaData(f.data);
        var u = unis[f.uni] || { nome: f.uni || "" };
        var corFesta = f.cor || "var(--terracota)";
        var idFesta = f.id ? f.id : ("festa-" + slugify(f.titulo) + "-" + f.data);
        var linkPaginaFesta = f.linkPagina || f.link || f.ingresso || ("#" + idFesta);

        var diaSemana = d ? DIAS_SEMANA[d.semana] : "";
        var mesNome = d ? MESES[d.mes - 1] : "";
        var diaNum = d ? dois(d.dia) : "";
        var faltam = diasFaltam(f.data);

        var flyerMidia = f.flyer || f.video || f.imagem || "";
        var eVideo = typeof flyerMidia === "string" && (flyerMidia.endsWith(".mp4") || flyerMidia.endsWith(".webm"));

        var htmlMini = "";
        if (flyerMidia) {
          htmlMini = '<div class="festa__mini-container" data-midia="' + escapar(flyerMidia) + '">' +
            (eVideo ? '<video class="festa__mini-media" src="' + escapar(flyerMidia) + '#t=0.1" preload="metadata" muted></video><div class="festa__play-icon">▶</div>' :
                      '<img class="festa__mini-media" src="' + escapar(flyerMidia) + '" alt="Flyer" loading="lazy">') +
            '</div>';
        }

        return (
          '<li class="festa" id="' + idFesta + '" style="--cor: ' + corFesta + ';">' +
            '<div class="festa__data">' +
              '<span class="festa__semana">' + diaSemana + '</span>' +
              '<span class="festa__dia">' + diaNum + '</span>' +
              '<span class="festa__mes">' + mesNome + '</span>' +
              (faltam ? '<span class="festa__faltam">' + faltam + '</span>' : '') +
            '</div>' +
            '<div class="festa__corpo">' +
              '<p class="festa__uni">' + escapar(u.nome) + (f.hora ? ' <span class="festa__hora">• ' + f.hora + '</span>' : '') + '</p>' +
              '<h3 class="festa__titulo">' +
                '<a class="festa__titulo-link" href="' + linkPaginaFesta + '" ' + (pareceLink(linkPaginaFesta) ? 'target="_blank" rel="noopener"' : '') + '>' +
                  escapar(f.titulo) +
                '</a>' +
              '</h3>' +
              (f.descricao ? '<p class="festa__descricao">' + escapar(f.descricao) + '</p>' : '') +
              '<div class="festa__links">' +
                (f.ingresso ? '<a class="festa__link festa__link--ingresso" href="' + f.ingresso + '" target="_blank" rel="noopener">Ingressos</a>' : '') +
                (f.instagram ? '<a class="festa__link festa__link--perfil" href="' + f.instagram + '" target="_blank" rel="noopener">Instagram</a>' : '') +
                (f.grupo ? '<a class="festa__link festa__link--grupo" href="' + f.grupo + '" target="_blank" rel="noopener">Grupo Oficial</a>' : '') +
                '<button type="button" class="festa__link festa__link--compartilhar" data-festa-id="' + idFesta + '">' +
                  '<span>Compartilhar</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
            htmlMini +
          '</li>'
        );
      }).join("");

      // Ouvintes dos botões de Compartilhar
      Array.prototype.forEach.call(lista.querySelectorAll(".festa__link--compartilhar"), function(btn) {
        btn.addEventListener("click", function(e) {
          e.preventDefault();
          var id = btn.getAttribute("data-festa-id");
          var url = window.location.origin + window.location.pathname + "#" + id;
          navigator.clipboard.writeText(url).then(function() {
            var span = btn.querySelector("span") || btn;
            var textoOriginal = span.textContent;
            span.textContent = "Link copiado!";
            setTimeout(function() {
              span.textContent = textoOriginal;
            }, 2000);
          }).catch(function(err) {
            console.error("Erro ao copiar link: ", err);
          });
        });
      });

      // Ouvintes para abrir modal de mídia do flyer
      Array.prototype.forEach.call(lista.querySelectorAll(".festa__mini-container"), function(container) {
        container.addEventListener("click", function() {
          var midiaSrc = container.getAttribute("data-midia");
          if (midiaSrc) abrirModalMidia(midiaSrc);
        });
      });
    }

    renderEstadosFesta();
    atualizarSelectCidadesFesta();
    atualizarSelectUnisFesta();
    desenhar();

    // Rolar para festa se a URL contiver hash da festa
    if (window.location.hash) {
      var targetId = window.location.hash.substring(1);
      var idx = festasBoas.findIndex(function(f) {
        var idFesta = f.id ? f.id : ("festa-" + slugify(f.titulo) + "-" + f.data);
        return idFesta === targetId;
      });

      if (idx !== -1) {
        // Mudar para aba de festas se estivesse em outra
        var abaFestas = document.getElementById("aba-festas");
        if (abaFestas) abaFestas.click();

        var pagAlvo = Math.floor(idx / POR_PAGINA) + 1;
        paginas.definirPagina(pagAlvo);
        desenhar();

        setTimeout(function() {
          var el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("festa--destaque");
            setTimeout(function() { el.classList.remove("festa--destaque"); }, 3000);
          }
        }, 300);
      }
    }

    return festasBoas.length;
  }

  function montarGrupos() {
    var lista = document.getElementById("lista");
    if (!lista) return 0;

    var selEstado = document.getElementById("select-estado");
    var selCidade = document.getElementById("select-cidade");
    var selUni    = document.getElementById("select-uni");
    var busca     = document.getElementById("busca");
    var containerChips = document.getElementById("chips");

    var estadosData = window.ESTADOS || {};
    var cidadesData = window.CIDADES || {};
    var unisData = window.UNIVERSIDADES || {};

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

    var catSel = "";
    var buscaTexto = "";

    var paginas = fazerPaginas({
      caixa: "grupos-paginas", voltar: "grupos-voltar", avancar: "grupos-avancar", onde: "grupos-onde"
    }, function () { desenhar(); });

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

    function renderChips() {
      if (!containerChips) return;
      var html = '<button class="chip" type="button" data-cat="" aria-pressed="' + (!catSel ? 'true' : 'false') + '">Todos</button>';

      Object.keys(categorias).forEach(function (catKey) {
        var c = categorias[catKey];
        var ativa = catSel === catKey;
        html += '<button class="chip" type="button" data-cat="' + catKey + '" aria-pressed="' + (ativa ? 'true' : 'false') + '">' +
                  escapar(c.nome) +
                '</button>';
      });

      containerChips.innerHTML = html;

      Array.prototype.forEach.call(containerChips.querySelectorAll(".chip"), function (btn) {
        btn.addEventListener("click", function () {
          catSel = btn.getAttribute("data-cat") || "";
          renderChips();
          paginas.reiniciar();
          desenhar();
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

    if (busca) {
      busca.addEventListener("input", function () {
        buscaTexto = simples(busca.value);
        paginas.reiniciar();
        desenhar();
      });
    }

    function desenhar() {
      var visiveis = gruposBons.filter(function (g) {
        var uniDoGrupo = unisData[g.uni];
        var cidDoGrupo = uniDoGrupo ? cidadesData[uniDoGrupo.cidade] : null;

        var bateEstado = !estadoSel || (cidDoGrupo && cidDoGrupo.estado === estadoSel);
        var bateCidade = !cidadeSel || (uniDoGrupo ? uniDoGrupo.cidade === cidadeSel : true);
        var bateUni = !uniSel || g.uni === uniSel || simples(g.uni) === simples(uniSel);
        var bateCat = !catSel || g.cat === catSel;

        var bateBusca = !buscaTexto || simples(g.nome).indexOf(buscaTexto) !== -1 || simples(g.desc || "").indexOf(buscaTexto) !== -1;

        return bateEstado && bateCidade && bateUni && bateCat && bateBusca;
      });

      var contagemEl = document.getElementById("contagem");
      if (contagemEl) {
        contagemEl.textContent = visiveis.length + " grupos encontrados";
      }

      var paginados = paginas.recortar(visiveis);

      if (paginados.length === 0) {
        lista.innerHTML = "";
        var vazioEl = document.getElementById("vazio");
        if (vazioEl) {
          vazioEl.textContent = "Nenhum grupo encontrado com esses filtros.";
          vazioEl.hidden = false;
        }
        return;
      } else {
        var vazioEl = document.getElementById("vazio");
        if (vazioEl) vazioEl.hidden = true;
      }

      lista.innerHTML = paginados.map(function (g) {
        var c = categorias[g.cat] || { cor: "var(--verde)", nome: "" };
        var m = Number(g.membros) || 0;

        return (
          '<li class="item" style="--cor: ' + (c.cor || "var(--verde)") + ';">' +
            '<a class="grupo" href="' + g.url + '" target="_blank" rel="noopener">' +
              '<span class="grupo__topo-linha">' +
                '<span class="grupo__nome">' + escapar(g.nome) + '</span>' +
                (g.lotado ? '<span class="etiqueta etiqueta--lotado">Lotado</span>' : '') +
                (g.novo ? '<span class="etiqueta etiqueta--novo">Novo</span>' : '') +
              '</span>' +
              (g.desc ? '<span class="grupo__desc">' + escapar(g.desc) + '</span>' : '') +
              '<span class="grupo__meta">' +
                '<span class="ponto"></span>' +
                '<span>' + escapar(c.nome || g.cat) + '</span>' +
                (m > 0 ? '<span>• ' + m + ' membros</span>' : '') +
                (g.admin ? '<span class="grupo__etiqueta-admin">Oficial</span>' : '') +
              '</span>' +
            '</a>' +
            '<a class="reportar" href="https://wa.me/' + (contatos.whatsapp || "5531991579687") + '?text=' + encodeURIComponent('Olá, vim pelo site! O grupo "' + g.nome + '" está com problema.') + '" target="_blank" rel="noopener" title="Reportar problema">' +
              '⚑' +
            '</a>' +
          '</li>'
        );
      }).join("");
    }

    renderEstados();
    atualizarSelectCidades();
    atualizarSelectUnis();
    renderChips();
    desenhar();

    // Calcular painel estatístico
    var totalMembros = gruposBons.reduce(function (acc, g) { return acc + (Number(g.membros) || 0); }, 0);
    var media = gruposBons.length > 0 ? Math.round(totalMembros / gruposBons.length) : 0;

    var elGrupos = document.getElementById("painel-grupos");
    var elMembros = document.getElementById("painel-membros");
    var elMedia = document.getElementById("painel-media");

    if (elGrupos) elGrupos.textContent = gruposBons.length;
    if (elMembros) elMembros.textContent = totalMembros.toLocaleString("pt-BR");
    if (elMedia) elMedia.textContent = media;

    return gruposBons.length;
  }

  function configurarAbas(totalGrupos, totalFestas) {
    var abaGrupos = document.getElementById("aba-grupos");
    var abaFestas = document.getElementById("aba-festas");
    var secGrupos = document.getElementById("secao-grupos");
    var secFestas = document.getElementById("secao-festas");

    var contaGrupos = document.getElementById("aba-grupos-conta");
    var contaFestas = document.getElementById("aba-festas-conta");

    if (contaGrupos) contaGrupos.textContent = totalGrupos;
    if (contaFestas) contaFestas.textContent = totalFestas;

    function alternar(paraGrupos) {
      if (abaGrupos) {
        abaGrupos.setAttribute("aria-selected", paraGrupos ? "true" : "false");
        abaGrupos.tabIndex = paraGrupos ? 0 : -1;
      }
      if (abaFestas) {
        abaFestas.setAttribute("aria-selected", paraGrupos ? "false" : "true");
        abaFestas.tabIndex = paraGrupos ? -1 : 0;
      }
      if (secGrupos) secGrupos.hidden = !paraGrupos;
      if (secFestas) secFestas.hidden = paraGrupos;
    }

    if (abaGrupos) abaGrupos.addEventListener("click", function () { alternar(true); });
    if (abaFestas) abaFestas.addEventListener("click", function () { alternar(false); });
  }

  function abrirModalMidia(src) {
    var modal = document.getElementById("modal-midia");
    var container = document.getElementById("modal-container-midia");
    if (!modal || !container) return;

    var eVideo = src.endsWith(".mp4") || src.endsWith(".webm");

    if (eVideo) {
      container.innerHTML = '<video class="modal-midia__midia" src="' + escapar(src) + '" controls autoplay></video>';
    } else {
      container.innerHTML = '<img class="modal-midia__midia" src="' + escapar(src) + '" alt="Flyer ampliado">';
    }

    modal.hidden = false;
  }

  function configurarModais() {
    // Modal de mídia
    var modalMidia = document.getElementById("modal-midia");
    var fecharMidia = document.getElementById("modal-fechar");

    if (fecharMidia && modalMidia) {
      fecharMidia.addEventListener("click", function () {
        modalMidia.hidden = true;
        var container = document.getElementById("modal-container-midia");
        if (container) container.innerHTML = "";
      });

      modalMidia.addEventListener("click", function (e) {
        if (e.target === modalMidia) {
          modalMidia.hidden = true;
          var container = document.getElementById("modal-container-midia");
          if (container) container.innerHTML = "";
        }
      });
    }

    // Modal de Comissário Pluri
    var modalComissario = document.getElementById("modal-comissario");
    var btnInfoComissario = document.getElementById("btn-comissario-info");
    var fecharComissario = document.getElementById("modal-comissario-fechar");
    var videoComissario = document.getElementById("video-comissario");

    if (btnInfoComissario && modalComissario) {
      btnInfoComissario.addEventListener("click", function () {
        modalComissario.hidden = false;
        if (videoComissario) videoComissario.play();
      });
    }

    if (fecharComissario && modalComissario) {
      fecharComissario.addEventListener("click", function () {
        modalComissario.hidden = true;
        if (videoComissario) videoComissario.pause();
      });

      modalComissario.addEventListener("click", function (e) {
        if (e.target === modalComissario) {
          modalComissario.hidden = true;
          if (videoComissario) videoComissario.pause();
        }
      });
    }
  }

  function inicializar() {
    aplicarTextos();
    configurarPix();
    montarParceiros();
    var numFestas = montarFestas();
    var numGrupos = montarGrupos();
    configurarAbas(numGrupos, numFestas);
    configurarModais();
    mostrarProblemas();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();