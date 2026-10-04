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
  var DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

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
    var bolinhas = document.getElementById("parceiros-bolinhas");
    if (!trilho || parceirosBons.length === 0) return;

    trilho.innerHTML = "";
    if (bolinhas) bolinhas.innerHTML = "";

    parceirosBons.forEach(function (p, i) {
      var card = document.createElement("article");
      card.className = "parceiro";
      card.innerHTML =
        '<div class="parceiro__topo">' +
          (p.logo ? '<img class="parceiro__logo" src="' + escapar(p.logo) + '" alt="' + escapar(p.nome) + '">' : '') +
          '<div>' +
            '<p class="parceiro__selo">Parceiro Oficial</p>' +
            '<h3 class="parceiro__nome">' + escapar(p.nome) + '</h3>' +
          '</div>' +
        '</div>' +
        '<p class="parceiro__chamada">' + escapar(p.descricao || p.chamada || '') + '</p>' +
        '<a class="parceiro__cta" href="' + escapar(p.link) + '" target="_blank" rel="noopener">Saiba mais →</a>';

      trilho.appendChild(card);

      if (bolinhas) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bolinha" + (i === 0 ? " ativa" : "");
        btn.setAttribute("aria-label", "Parceiro " + (i + 1));
        btn.addEventListener("click", function () {
          card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        });
        bolinhas.appendChild(btn);
      }
    });
  }

  /* MODAL DE MÍDIA */
  function configurarModalMidia() {
    var modal = document.getElementById("modal-midia");
    var fechar = document.getElementById("modal-fechar");
    var container = document.getElementById("modal-container-midia");

    if (!modal || !container) return;

    function fecharModal() {
      modal.hidden = true;
      container.innerHTML = "";
    }

    if (fechar) fechar.addEventListener("click", fecharModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) fecharModal();
    });

    window.abrirMidia = function (url, tipo) {
      container.innerHTML = "";
      if (tipo === "video") {
        var video = document.createElement("video");
        video.className = "modal-midia__midia";
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        container.appendChild(video);
      } else {
        var img = document.createElement("img");
        img.className = "modal-midia__midia";
        img.src = url;
        img.alt = "Flyer da festa";
        container.appendChild(img);
      }
      modal.hidden = false;
    };
  }

  /* MODAL COMISSÁRIO PLURI */
  function configurarModalComissario() {
    var btnInfo = document.getElementById("btn-comissario-info");
    var modal = document.getElementById("modal-comissario");
    var fechar = document.getElementById("modal-comissario-fechar");
    var video = document.getElementById("video-comissario");

    if (!btnInfo || !modal) return;

    btnInfo.addEventListener("click", function () {
      modal.hidden = false;
      if (video) video.play();
    });

    function fecharComissario() {
      modal.hidden = true;
      if (video) video.pause();
    }

    if (fechar) fechar.addEventListener("click", fecharComissario);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) fecharComissario();
    });
  }

  /* FESTAS */
  function montarFestas() {
    var listaFestas = document.getElementById("festas-lista");
    var vazioFestas = document.getElementById("festas-vazio");
    var filtroDia = document.getElementById("festas-dia");
    var btnLimpar = document.getElementById("festas-limpar");
    var selectEstado = document.getElementById("select-estado-festas");
    var selectCidade = document.getElementById("select-cidade-festas");
    var selectUni = document.getElementById("select-uni-festas");

    if (!listaFestas) return;

    var paginadorFestas = fazerPaginas(
      { caixa: "festas-paginas", voltar: "festas-voltar", avancar: "festas-avancar", onde: "festas-onde" },
      renderizarFestas
    );

    function popularSelects() {
      if (!selectEstado) return;
      selectEstado.innerHTML = '<option value="">Todos os Estados</option>';
      
      var estados = {};
      Object.keys(unis).forEach(function (key) {
        var u = unis[key];
        if (u && u.estado) estados[u.estado] = true;
      });

      Object.keys(estados).sort().forEach(function (uf) {
        var opt = document.createElement("option");
        opt.value = uf;
        opt.textContent = uf;
        selectEstado.appendChild(opt);
      });
    }

    popularSelects();

    if (selectEstado) {
      selectEstado.addEventListener("change", function () {
        var uf = selectEstado.value;
        if (selectCidade) {
          selectCidade.innerHTML = '<option value="">Todas as Cidades</option>';
          selectCidade.disabled = !uf;
          if (uf) {
            var cidades = {};
            Object.keys(unis).forEach(function (key) {
              var u = unis[key];
              if (u && u.estado === uf && u.cidade) cidades[u.cidade] = true;
            });
            Object.keys(cidades).sort().forEach(function (cid) {
              var opt = document.createElement("option");
              opt.value = cid;
              opt.textContent = cid;
              selectCidade.appendChild(opt);
            });
          }
        }
        if (selectUni) {
          selectUni.innerHTML = '<option value="">Todas as Universidades</option>';
          selectUni.disabled = !uf;
        }
        paginadorFestas.reiniciar();
        renderizarFestas();
      });
    }

    if (selectCidade) {
      selectCidade.addEventListener("change", function () {
        var cid = selectCidade.value;
        if (selectUni) {
          selectUni.innerHTML = '<option value="">Todas as Universidades</option>';
          selectUni.disabled = !cid;
          if (cid) {
            Object.keys(unis).forEach(function (key) {
              var u = unis[key];
              if (u && u.cidade === cid) {
                var opt = document.createElement("option");
                opt.value = key;
                opt.textContent = u.sigla || u.nome || key;
                selectUni.appendChild(opt);
              }
            });
          }
        }
        paginadorFestas.reiniciar();
        renderizarFestas();
      });
    }

    if (selectUni) {
      selectUni.addEventListener("change", function () {
        paginadorFestas.reiniciar();
        renderizarFestas();
      });
    }

    if (filtroDia) {
      filtroDia.addEventListener("change", function () {
        if (btnLimpar) btnLimpar.hidden = !filtroDia.value;
        paginadorFestas.reiniciar();
        renderizarFestas();
      });
    }

    if (btnLimpar) {
      btnLimpar.addEventListener("click", function () {
        if (filtroDia) filtroDia.value = "";
        btnLimpar.hidden = true;
        paginadorFestas.reiniciar();
        renderizarFestas();
      });
    }

    function renderizarFestas() {
      var diaFiltro = filtroDia ? filtroDia.value : "";
      var ufSel = selectEstado ? selectEstado.value : "";
      var cidSel = selectCidade ? selectCidade.value : "";
      var uniSel = selectUni ? selectUni.value : "";

      var filtradas = festasBoas.filter(function (f) {
        var u = unis[f.uni] || {};
        if (diaFiltro && f.data !== diaFiltro) return false;
        if (ufSel && u.estado !== ufSel) return false;
        if (cidSel && u.cidade !== cidSel) return false;
        if (uniSel && f.uni !== uniSel) return false;
        return true;
      });

      filtradas.sort(function (a, b) {
        return a.data.localeCompare(b.data);
      });

      var exibidas = paginadorFestas.recortar(filtradas);

      if (filtradas.length === 0) {
        listaFestas.innerHTML = "";
        if (vazioFestas) {
          vazioFestas.textContent = "Nenhuma festa encontrada para os filtros selecionados.";
          vazioFestas.hidden = false;
        }
        return;
      }

      if (vazioFestas) vazioFestas.hidden = true;
      listaFestas.innerHTML = "";

      var hojeIso = new Date().toISOString().split("T")[0];

      exibidas.forEach(function (f) {
        var p = partesDaData(f.data);
        var u = unis[f.uni] || {};
        var li = document.createElement("li");
        li.className = "festa";
        if (u.cor) li.style.setProperty("--cor", u.cor);

        var dataAtual = new Date(hojeIso);
        var dataFesta = new Date(f.data);
        var diffDias = Math.ceil((dataFesta - dataAtual) / (1000 * 60 * 60 * 24));
        var faltamTexto = "";
        if (diffDias === 0) faltamTexto = "É hoje!";
        else if (diffDias === 1) faltamTexto = "Amanhã";
        else if (diffDias > 1) faltamTexto = "Faltam " + diffDias + "d";

        var htmlMini = "";
        if (f.flyer) {
          var isVid = f.flyer.endsWith(".mp4") || f.flyer.endsWith(".webm");
          htmlMini =
            '<div class="festa__mini-container" onclick="abrirMidia(\'' + escapar(f.flyer) + '\', \'' + (isVid ? 'video' : 'imagem') + '\')">' +
              (isVid
                ? '<video class="festa__mini-media" src="' + escapar(f.flyer) + '#t=0.5" preload="metadata"></video><span class="festa__play-icon">▶</span>'
                : '<img class="festa__mini-media" src="' + escapar(f.flyer) + '" alt="' + escapar(f.titulo) + '">') +
            '</div>';
        }

        var htmlDescricao = f.descricao ? '<p class="festa__descricao">' + escapar(f.descricao) + '</p>' : '';

        var htmlLinks = '<div class="festa__links">';
        if (f.ingresso) {
          htmlLinks += '<a class="festa__link festa__link--ingresso" href="' + escapar(f.ingresso) + '" target="_blank" rel="noopener">Ingressos</a>';
        }
        if (f.instagram) {
          htmlLinks += '<a class="festa__link festa__link--perfil" href="' + escapar(f.instagram) + '" target="_blank" rel="noopener">Instagram</a>';
        }
        if (f.grupo) {
          htmlLinks += '<a class="festa__link festa__link--grupo" href="' + escapar(f.grupo) + '" target="_blank" rel="noopener">Grupo WhatsApp</a>';
        }
        htmlLinks += '</div>';

        li.innerHTML =
          '<div class="festa__data">' +
            '<span class="festa__semana">' + DIAS_SEMANA[p.semana] + '</span>' +
            '<span class="festa__dia">' + dois(p.dia) + '</span>' +
            '<span class="festa__mes">' + MESES[p.mes - 1] + '</span>' +
            (faltamTexto ? '<span class="festa__faltam">' + faltamTexto + '</span>' : '') +
          '</div>' +
          '<div class="festa__corpo">' +
            '<p class="festa__uni">' + escapar(u.sigla || f.uni) + (f.hora ? ' • <span class="festa__hora">' + escapar(f.hora) + '</span>' : '') + '</p>' +
            '<h3 class="festa__titulo">' + escapar(f.titulo) + '</h3>' +
            htmlDescricao +
            htmlLinks +
          '</div>' +
          htmlMini;

        listaFestas.appendChild(li);
      });
    }

    renderizarFestas();
  }

  /* GRUPOS */
  function montarGrupos() {
    var listaGrupos = document.getElementById("lista");
    var vazioGrupos = document.getElementById("vazio");
    var buscaInput = document.getElementById("busca");
    var contagemEl = document.getElementById("contagem");
    var chipsContainer = document.getElementById("chips");
    var selectEstado = document.getElementById("select-estado");
    var selectCidade = document.getElementById("select-cidade");
    var selectUni = document.getElementById("select-uni");

    var painelGrupos = document.getElementById("painel-grupos");
    var painelMembros = document.getElementById("painel-membros");
    var painelMedia = document.getElementById("painel-media");

    if (!listaGrupos) return;

    var catSelecionada = "";

    var paginadorGrupos = fazerPaginas(
      { caixa: "grupos-paginas", voltar: "grupos-voltar", avancar: "grupos-avancar", onde: "grupos-onde" },
      renderizarGrupos
    );

    function popularSelects() {
      if (!selectEstado) return;
      selectEstado.innerHTML = '<option value="">Todos os Estados</option>';

      var estados = {};
      Object.keys(unis).forEach(function (key) {
        var u = unis[key];
        if (u && u.estado) estados[u.estado] = true;
      });

      Object.keys(estados).sort().forEach(function (uf) {
        var opt = document.createElement("option");
        opt.value = uf;
        opt.textContent = uf;
        selectEstado.appendChild(opt);
      });
    }

    popularSelects();

    if (selectEstado) {
      selectEstado.addEventListener("change", function () {
        var uf = selectEstado.value;
        if (selectCidade) {
          selectCidade.innerHTML = '<option value="">Todas as Cidades</option>';
          selectCidade.disabled = !uf;
          if (uf) {
            var cidades = {};
            Object.keys(unis).forEach(function (key) {
              var u = unis[key];
              if (u && u.estado === uf && u.cidade) cidades[u.cidade] = true;
            });
            Object.keys(cidades).sort().forEach(function (cid) {
              var opt = document.createElement("option");
              opt.value = cid;
              opt.textContent = cid;
              selectCidade.appendChild(opt);
            });
          }
        }
        if (selectUni) {
          selectUni.innerHTML = '<option value="">Todas as Universidades</option>';
          selectUni.disabled = !uf;
        }
        paginadorGrupos.reiniciar();
        renderizarGrupos();
      });
    }

    if (selectCidade) {
      selectCidade.addEventListener("change", function () {
        var cid = selectCidade.value;
        if (selectUni) {
          selectUni.innerHTML = '<option value="">Todas as Universidades</option>';
          selectUni.disabled = !cid;
          if (cid) {
            Object.keys(unis).forEach(function (key) {
              var u = unis[key];
              if (u && u.cidade === cid) {
                var opt = document.createElement("option");
                opt.value = key;
                opt.textContent = u.sigla || u.nome || key;
                selectUni.appendChild(opt);
              }
            });
          }
        }
        paginadorGrupos.reiniciar();
        renderizarGrupos();
      });
    }

    if (selectUni) {
      selectUni.addEventListener("change", function () {
        paginadorGrupos.reiniciar();
        renderizarGrupos();
      });
    }

    function montarChips() {
      if (!chipsContainer) return;
      chipsContainer.innerHTML = "";

      var btnTodos = document.createElement("button");
      btnTodos.className = "chip";
      btnTodos.type = "button";
      btnTodos.textContent = "Todos";
      btnTodos.setAttribute("aria-pressed", catSelecionada === "" ? "true" : "false");
      btnTodos.addEventListener("click", function () {
        catSelecionada = "";
        atualizarChips();
        paginadorGrupos.reiniciar();
        renderizarGrupos();
      });
      chipsContainer.appendChild(btnTodos);

      Object.keys(categorias).forEach(function (key) {
        var cat = categorias[key];
        var btn = document.createElement("button");
        btn.className = "chip";
        btn.type = "button";
        btn.textContent = cat.nome || key;
        btn.setAttribute("aria-pressed", catSelecionada === key ? "true" : "false");
        btn.addEventListener("click", function () {
          catSelecionada = key;
          atualizarChips();
          paginadorGrupos.reiniciar();
          renderizarGrupos();
        });
        chipsContainer.appendChild(btn);
      });
    }

    function atualizarChips() {
      if (!chipsContainer) return;
      var botoes = chipsContainer.querySelectorAll(".chip");
      botoes.forEach(function (b, idx) {
        if (idx === 0) {
          b.setAttribute("aria-pressed", catSelecionada === "" ? "true" : "false");
        } else {
          var keys = Object.keys(categorias);
          b.setAttribute("aria-pressed", catSelecionada === keys[idx - 1] ? "true" : "false");
        }
      });
    }

    montarChips();

    if (buscaInput) {
      buscaInput.addEventListener("input", function () {
        paginadorGrupos.reiniciar();
        renderizarGrupos();
      });
    }

    function renderizarGrupos() {
      var termo = buscaInput ? buscaInput.value.toLowerCase().trim() : "";
      var ufSel = selectEstado ? selectEstado.value : "";
      var cidSel = selectCidade ? selectCidade.value : "";
      var uniSel = selectUni ? selectUni.value : "";

      var filtrados = gruposBons.filter(function (g) {
        var u = unis[g.uni] || {};
        if (catSelecionada && g.cat !== catSelecionada) return false;
        if (ufSel && u.estado !== ufSel) return false;
        if (cidSel && u.cidade !== cidSel) return false;
        if (uniSel && g.uni !== uniSel) return false;
        if (termo) {
          var textoG = (g.nome + " " + (g.desc || "")).toLowerCase();
          if (textoG.indexOf(termo) === -1) return false;
        }
        return true;
      });

      /* Atualizar painel */
      var totalMembros = 0;
      filtrados.forEach(function (g) {
        if (g.membros) totalMembros += Number(g.membros) || 0;
      });

      if (painelGrupos) painelGrupos.textContent = filtrados.length;
      if (painelMembros) painelMembros.textContent = totalMembros.toLocaleString("pt-BR");
      if (painelMedia) painelMedia.textContent = filtrados.length > 0 ? Math.round(totalMembros / filtrados.length) : 0;

      if (contagemEl) contagemEl.textContent = filtrados.length + " grupos encontrados";

      var exibidos = paginadorGrupos.recortar(filtrados);

      if (filtrados.length === 0) {
        listaGrupos.innerHTML = "";
        if (vazioGrupos) {
          vazioGrupos.textContent = "Nenhum grupo encontrado.";
          vazioGrupos.hidden = false;
        }
        return;
      }

      if (vazioGrupos) vazioGrupos.hidden = true;
      listaGrupos.innerHTML = "";

      exibidos.forEach(function (g) {
        var cat = categorias[g.cat] || {};
        var u = unis[g.uni] || {};
        var li = document.createElement("li");
        li.className = "item";
        if (cat.cor) li.style.setProperty("--cor", cat.cor);

        var htmlDesc = g.desc ? '<span class="grupo__desc">' + escapar(g.desc) + '</span>' : '';
        var htmlMembros = g.membros ? '<span>' + g.membros + ' membros</span>' : '';
        var htmlLotado = g.lotado ? '<span class="etiqueta etiqueta--lotado">Lotado</span>' : '';
        var htmlNovo = g.novo ? '<span class="etiqueta etiqueta--novo">Novo</span>' : '';
        var htmlAdmin = g.admin ? '<span class="grupo__etiqueta-admin">ADMIN</span>' : '';

        var linkReportar = (contatos && contatos.suporte)
          ? contatos.suporte + '?text=' + encodeURIComponent('Olá, quero reportar um problema no grupo: ' + g.nome)
          : '#';

        li.innerHTML =
          '<a class="grupo" href="' + escapar(g.url) + '" target="_blank" rel="noopener">' +
            '<div class="grupo__topo-linha">' +
              '<span class="grupo__nome">' + escapar(g.nome) + '</span>' +
              htmlAdmin +
            '</div>' +
            htmlDesc +
            '<div class="grupo__meta">' +
              '<span class="ponto"></span>' +
              '<span>' + escapar(cat.nome || g.cat) + '</span>' +
              (u.sigla ? '<span>• ' + escapar(u.sigla) + '</span>' : '') +
              htmlMembros +
              htmlLotado +
              htmlNovo +
            '</div>' +
          '</a>' +
          '<a class="reportar" href="' + escapar(linkReportar) + '" target="_blank" rel="noopener" title="Reportar grupo">⚠</a>';

        listaGrupos.appendChild(li);
      });
    }

    renderizarGrupos();
  }

  /* ABAS */
  function configurarAbas() {
    var abaGrupos = document.getElementById("aba-grupos");
    var abaFestas = document.getElementById("aba-festas");
    var secaoGrupos = document.getElementById("secao-grupos");
    var secaoFestas = document.getElementById("secao-festas");
    var contaGrupos = document.getElementById("aba-grupos-conta");
    var contaFestas = document.getElementById("aba-festas-conta");

    if (contaGrupos) contaGrupos.textContent = gruposBons.length;
    if (contaFestas) contaFestas.textContent = festasBoas.length;

    function alternarAba(abaParaAtivar) {
      if (abaParaAtivar === "festas") {
        if (abaFestas) abaFestas.setAttribute("aria-selected", "true");
        if (abaGrupos) abaGrupos.setAttribute("aria-selected", "false");
        if (secaoFestas) secaoFestas.hidden = false;
        if (secaoGrupos) secaoGrupos.hidden = true;
      } else {
        if (abaGrupos) abaGrupos.setAttribute("aria-selected", "true");
        if (abaFestas) abaFestas.setAttribute("aria-selected", "false");
        if (secaoGrupos) secaoGrupos.hidden = false;
        if (secaoFestas) secaoFestas.hidden = true;
      }
    }

    if (abaGrupos) {
      abaGrupos.addEventListener("click", function () { alternarAba("grupos"); });
    }

    if (abaFestas) {
      abaFestas.addEventListener("click", function () { alternarAba("festas"); });
    }
  }

  /* SUPORTE & LINKS ADICIONAIS */
  function configurarLinks() {
    var suporte = document.getElementById("suporte");
    if (suporte && contatos && contatos.suporte) {
      suporte.href = contatos.suporte;
      suporte.textContent = contatos.suporteRotulo || "Falar com suporte";
    }

    var listaCompleta = document.getElementById("lista-completa");
    if (listaCompleta && contatos && contatos.listaCompleta) {
      listaCompleta.href = contatos.listaCompleta;
    }

    var caronas = document.getElementById("caronas");
    if (caronas && contatos && contatos.caronas) {
      caronas.href = contatos.caronas;
    }
  }

  /* INICIALIZAÇÃO */
  document.addEventListener("DOMContentLoaded", function () {
    aplicarTextos();
    configurarPix();
    montarParceiros();
    configurarModalMidia();
    configurarModalComissario();
    montarFestas();
    montarGrupos();
    configurarAbas();
    configurarLinks();
    mostrarProblemas();
  });
})();