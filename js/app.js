/* ═══════════════════════════════════════════════════════════════════════════
   PLURIVERSIDADE - SISTEMA COMPLETO + PAINEL DE ADMINISTRAÇÃO
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
      reclamar(arquivo, "O arquivo não foi lido até o fim, então " + nome + " não existe.");
      return false;
    }
    return true;
  }

  /* -------------------------------------------------------------------------
     LEITURA DOS ARQUIVOS DE DADOS
     ------------------------------------------------------------------------- */
  var temTextos     = existe("TEXTOS",               window.TEXTOS,               "js/dados-textos.js");
  var temContatos   = existe("CONTATOS",             window.CONTATOS,             "js/dados-textos.js");
  var temGrupos     = existe("GRUPOS",               window.GRUPOS,               "js/dados-grupos.js");
  var temCategorias = existe("CATEGORIAS",           window.CATEGORIAS,           "js/dados-grupos.js");
  var temFestas     = existe("FESTAS",               window.FESTAS,               "js/dados-festas.js");
  var temUnis       = existe("UNIVERSIDADES",        window.UNIVERSIDADES,        "js/dados-festas.js");
  var temUnisG      = existe("UNIVERSIDADES_GRUPOS", window.UNIVERSIDADES_GRUPOS, "js/dados-grupos.js");
  var temParceiros  = existe("PARCEIROS",            window.PARCEIROS,            "js/dados-parceiros.js");

  var textos      = temTextos     ? TEXTOS               : {};
  var contatos    = temContatos   ? CONTATOS             : {};
  var grupos      = temGrupos     ? GRUPOS               : [];
  var categorias  = temCategorias ? CATEGORIAS           : {};
  var festas      = temFestas     ? FESTAS               : [];
  var unis        = temUnis       ? UNIVERSIDADES        : {};
  var unisGrupos  = temUnisG      ? UNIVERSIDADES_GRUPOS : {};
  var parceiros   = temParceiros  ? PARCEIROS            : [];
  var ajustes     = (typeof window.AJUSTES === "object" && AJUSTES) ? AJUSTES : {};

  var POR_PAGINA = 5;
  if (typeof ajustes.porPagina !== "undefined") {
    var pedido = Number(ajustes.porPagina);
    if (isFinite(pedido) && pedido >= 1) POR_PAGINA = Math.floor(pedido);
  }

  var MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

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
     MODAL DE MÍDIA COMPLETA (FESTAS)
     ------------------------------------------------------------------------- */
  function configurarModalMidia() {
    var modal = document.getElementById("modal-midia");
    var container = document.getElementById("modal-container-midia");
    var btnFechar = document.getElementById("modal-fechar");

    if (!modal || !container) return;

    function fechar() {
      modal.hidden = true;
      container.innerHTML = "";
    }

    if (btnFechar) btnFechar.addEventListener("click", fechar);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) fechar();
    });

    window.abrirModalMidia = function (src) {
      if (!src) return;
      var ext = src.split(".").pop().toLowerCase();
      if (ext === "mp4" || ext === "webm") {
        container.innerHTML = '<video src="' + src + '" controls autoplay style="max-width:100%; max-height:80vh;"></video>';
      } else {
        container.innerHTML = '<img src="' + src + '" alt="Mídia da festa" style="max-width:100%; max-height:80vh; object-fit:contain;">';
      }
      modal.hidden = false;
    };
  }

  /* -------------------------------------------------------------------------
     PAGINAÇÃO E SUPORTE
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

  function aplicarTextos() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-texto]"), function (el) {
      var chave = el.getAttribute("data-texto");
      if (typeof textos[chave] === "string") el.textContent = textos[chave];
    });

    var elSuporte = document.getElementById("suporte");
    if (elSuporte && contatos && contatos.suporte) {
      elSuporte.href = "https://wa.me/" + contatos.suporte.replace(/\D/g, "");
    }
  }

  function configurarPix() {
    var botaoPix = document.getElementById("copiar-pix");
    var pixNumero = document.getElementById("pix-numero");
    var pixRotulo = document.getElementById("pix-rotulo");

    var chavePix = (contatos && contatos.pix) ? contatos.pix : "pix@pluri.com";

    if (pixNumero) pixNumero.textContent = chavePix;

    if (botaoPix) {
      botaoPix.addEventListener("click", function () {
        navigator.clipboard.writeText(chavePix).then(function () {
          if (pixRotulo) {
            var original = pixRotulo.textContent;
            pixRotulo.textContent = "Chave copiada!";
            setTimeout(function () { pixRotulo.textContent = original; }, 2500);
          }
        });
      });
    }
  }

  function montarParceiros() {
    var trilho = document.getElementById("parceiros");
    if (!trilho) return;

    var parceirosBons = parceiros.filter(function (p) {
      return p && p.nome && pareceLink(p.link);
    });

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
  }

  /* -------------------------------------------------------------------------
     RENDERIZAÇÃO COMPLETA DE FESTAS
     ------------------------------------------------------------------------- */
  var paginasFestas;
  function montarFestas() {
    var lista = document.getElementById("festas-lista");
    if (!lista) return 0;

    var selEstadoFesta = document.getElementById("select-estado-festas");
    var selCidadeFesta = document.getElementById("select-cidade-festas");
    var selUniFesta    = document.getElementById("select-uni-festas");
    var campoData      = document.getElementById("festas-dia");
    var btnLimparData  = document.getElementById("festas-limpar");

    var estadosData = window.ESTADOS || {};
    var cidadesData = window.CIDADES || {};
    var unisData    = window.UNIVERSIDADES || {};

    var festasBoas = festas.filter(function (f) {
      return f && f.titulo && partesDaData(f.data);
    });

    paginasFestas = fazerPaginas({
      caixa: "festas-paginas", voltar: "festas-voltar", avancar: "festas-avancar", onde: "festas-onde"
    }, function () { desenhar(); });

    function desenhar() {
      var dataSel = campoData ? campoData.value : "";
      var uniSel = selUniFesta ? selUniFesta.value : "";

      var visiveis = festasBoas.filter(function (f) {
        var bateUni = !uniSel || f.uni === uniSel;
        var bateData = !dataSel || f.data === dataSel;
        return bateUni && bateData;
      });

      lista.innerHTML = paginasFestas.recortar(visiveis).map(function (f) {
        var d = partesDaData(f.data);
        var u = unisData[f.uni] || { nome: f.uni || "" };

        return (
          '<li class="festa">' +
            '<div class="festa__corpo">' +
              '<p class="festa__uni">' + escapar(u.nome) + '</p>' +
              '<h3 class="festa__titulo">' + escapar(f.titulo) + '</h3>' +
              '<p class="festa__data-hora">' + d.dia + '/' + MESES[d.mes - 1] + ' - ' + (f.hora || '') + '</p>' +
              '<p class="festa__descricao">' + escapar(f.descricao || "") + '</p>' +
              '<div class="festa__acoes">' +
                (f.midia ? '<button class="btn-midia" type="button" onclick="abrirModalMidia(\'' + f.midia + '\')">Ver Mídia</button>' : '') +
                (f.ingresso ? '<a class="btn-ingresso" href="' + f.ingresso + '" target="_blank" rel="noopener">Ingresso</a>' : '') +
              '</div>' +
            '</div>' +
          '</li>'
        );
      }).join("");

      var contaAba = document.getElementById("aba-festas-conta");
      if (contaAba) contaAba.textContent = visiveis.length;
    }

    if (campoData) {
      campoData.addEventListener("change", function () {
        if (btnLimparData) btnLimparData.hidden = !campoData.value;
        paginasFestas.reiniciar();
        desenhar();
      });
    }

    if (btnLimparData) {
      btnLimparData.addEventListener("click", function () {
        campoData.value = "";
        btnLimparData.hidden = true;
        paginasFestas.reiniciar();
        desenhar();
      });
    }

    desenhar();
    return festasBoas.length;
  }

  /* -------------------------------------------------------------------------
     RENDERIZAÇÃO COMPLETA DE GRUPOS
     ------------------------------------------------------------------------- */
  var paginasGrupos;
  function montarGrupos() {
    var lista = document.getElementById("lista");
    if (!lista) return 0;

    var busca = document.getElementById("busca");
    var contagem = document.getElementById("contagem");
    var buscaTexto = "";

    var gruposBons = grupos.filter(function (g) {
      return g && g.nome && pareceLink(g.url);
    });

    paginasGrupos = fazerPaginas({
      caixa: "grupos-paginas", voltar: "grupos-voltar", avancar: "grupos-avancar", onde: "grupos-onde"
    }, function () { desenhar(); });

    if (busca) {
      busca.addEventListener("input", function () {
        buscaTexto = busca.value.toLowerCase();
        paginasGrupos.reiniciar();
        desenhar();
      });
    }

    function desenhar() {
      var visiveis = gruposBons.filter(function (g) {
        return !buscaTexto || g.nome.toLowerCase().indexOf(buscaTexto) !== -1;
      });

      lista.innerHTML = paginasGrupos.recortar(visiveis).map(function (g) {
        var ehLotado = Boolean(g.lotado) || (Number(g.membros) >= 1024);

        return (
          '<li class="item">' +
            '<div class="grupo__conteudo">' +
              '<a class="grupo" href="' + g.url + '" target="_blank" rel="noopener">' +
                '<span class="grupo__nome">' + escapar(g.nome) + '</span>' +
                (g.desc ? '<span class="grupo__desc">' + escapar(g.desc) + '</span>' : '') +
                '<span class="grupo__meta">' +
                  (g.membros ? g.membros + ' membros' : '') +
                  (ehLotado ? ' • <span class="etiqueta etiqueta--lotado">LOTADO</span>' : '') +
                '</span>' +
              '</a>' +
            '</div>' +
            '<a class="grupo__btn-entrar ' + (ehLotado ? 'grupo__btn-entrar--lotado' : '') + '" href="' + g.url + '" target="_blank" rel="noopener">' +
              (ehLotado ? 'GRUPO LOTADO' : 'ENTRAR NO GRUPO') +
            '</a>' +
          '</li>'
        );
      }).join("");

      if (contagem) contagem.textContent = visiveis.length + " grupos encontrados";
      var contaAba = document.getElementById("aba-grupos-conta");
      if (contaAba) contaAba.textContent = visiveis.length;
    }

    desenhar();
    return gruposBons.length;
  }

  function configurarAbas() {
    var btnGrupos = document.getElementById("aba-grupos");
    var btnFestas = document.getElementById("aba-festas");
    var btnAdmin  = document.getElementById("aba-admin");

    var secGrupos = document.getElementById("secao-grupos");
    var secFestas = document.getElementById("secao-festas");
    var secAdmin  = document.getElementById("secao-admin");

    function ativar(aba) {
      if (btnGrupos) btnGrupos.setAttribute("aria-selected", aba === "grupos");
      if (btnFestas) btnFestas.setAttribute("aria-selected", aba === "festas");
      if (btnAdmin)  btnAdmin.setAttribute("aria-selected", aba === "admin");

      if (secGrupos) secGrupos.hidden = (aba !== "grupos");
      if (secFestas) secFestas.hidden = (aba !== "festas");
      if (secAdmin)  secAdmin.hidden = (aba !== "admin");
    }

    if (btnGrupos) btnGrupos.addEventListener("click", function () { ativar("grupos"); });
    if (btnFestas) btnFestas.addEventListener("click", function () { ativar("festas"); });
    if (btnAdmin)  btnAdmin.addEventListener("click", function () { ativar("admin"); });
  }

  /* -------------------------------------------------------------------------
     PAINEL ADMINISTRATIVO INTEGRADO
     ------------------------------------------------------------------------- */
  function configurarAdmin() {
    var formLogin = document.getElementById("form-login-admin");
    var boxLogin = document.getElementById("admin-login-box");
    var boxPainel = document.getElementById("admin-painel-box");
    var msgErro = document.getElementById("login-erro");
    var btnLogout = document.getElementById("btn-admin-logout");

    if (sessionStorage.getItem("admin_logado") === "true") {
      if (boxLogin) boxLogin.hidden = true;
      if (boxPainel) boxPainel.hidden = false;
      renderizarAdmin();
    }

    if (formLogin) {
      formLogin.addEventListener("submit", function (e) {
        e.preventDefault();
        var user = document.getElementById("login-usuario").value;
        var pass = document.getElementById("login-senha").value;

        if (user === "lucastroy" && pass === "#Maconha420") {
          sessionStorage.setItem("admin_logado", "true");
          boxLogin.hidden = true;
          boxPainel.hidden = false;
          msgErro.hidden = true;
          renderizarAdmin();
        } else {
          msgErro.hidden = false;
        }
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener("click", function () {
        sessionStorage.removeItem("admin_logado");
        boxLogin.hidden = false;
        boxPainel.hidden = true;
      });
    }

    var subabas = ["grupos", "festas", "config", "exportar"];
    subabas.forEach(function (nome) {
      var btn = document.getElementById("subaba-" + nome);
      if (btn) {
        btn.addEventListener("click", function () {
          subabas.forEach(function (s) {
            var b = document.getElementById("subaba-" + s);
            var p = document.getElementById("painel-sub-" + s);
            if (b) b.classList.remove("ativa");
            if (p) p.hidden = true;
          });
          btn.classList.add("ativa");
          var painel = document.getElementById("painel-sub-" + nome);
          if (painel) painel.hidden = false;

          if (nome === "exportar") gerarCodigosExportacao();
        });
      }
    });

    var selCatAdm = document.getElementById("adm-g-cat");
    if (selCatAdm) {
      selCatAdm.innerHTML = Object.keys(categorias).map(function (k) {
        return '<option value="' + k + '">' + categorias[k].nome + '</option>';
      }).join("");
    }

    var selUniAdm = document.getElementById("adm-f-uni");
    if (selUniAdm) {
      selUniAdm.innerHTML = Object.keys(unis).map(function (k) {
        return '<option value="' + k + '">' + unis[k].nome + '</option>';
      }).join("");
    }

    var formGrupo = document.getElementById("form-admin-grupo");
    if (formGrupo) {
      formGrupo.addEventListener("submit", function (e) {
        e.preventDefault();
        var idx = Number(document.getElementById("admin-grupo-index").value);

        var gData = {
          nome: document.getElementById("adm-g-nome").value,
          uni: document.getElementById("adm-g-uni").value,
          cat: document.getElementById("adm-g-cat").value,
          url: document.getElementById("adm-g-url").value,
          membros: Number(document.getElementById("adm-g-membros").value) || 0,
          desc: document.getElementById("adm-g-desc").value,
          lotado: document.getElementById("adm-g-lotado").checked,
          novo: document.getElementById("adm-g-novo").checked
        };

        if (idx >= 0) {
          grupos[idx] = gData;
        } else {
          grupos.unshift(gData);
        }

        formGrupo.reset();
        document.getElementById("admin-grupo-index").value = "-1";
        montarGrupos();
        renderizarAdmin();
        alert("Grupo salvo!");
      });
    }

    var formFesta = document.getElementById("form-admin-festa");
    if (formFesta) {
      formFesta.addEventListener("submit", function (e) {
        e.preventDefault();
        var idx = Number(document.getElementById("admin-festa-index").value);

        var fData = {
          id: document.getElementById("adm-f-id").value,
          titulo: document.getElementById("adm-f-titulo").value,
          data: document.getElementById("adm-f-data").value,
          hora: document.getElementById("adm-f-hora").value,
          uni: document.getElementById("adm-f-uni").value,
          midia: document.getElementById("adm-f-midia").value,
          ingresso: document.getElementById("adm-f-ingresso").value,
          perfil: document.getElementById("adm-f-perfil").value,
          descricao: document.getElementById("adm-f-desc").value
        };

        if (idx >= 0) {
          festas[idx] = fData;
        } else {
          festas.unshift(fData);
        }

        formFesta.reset();
        document.getElementById("admin-festa-index").value = "-1";
        montarFestas();
        renderizarAdmin();
        alert("Festa salva!");
      });
    }

    var formConfig = document.getElementById("form-admin-config");
    if (formConfig) {
      document.getElementById("adm-c-titulo").value = textos.titulo || "";
      document.getElementById("adm-c-subtitulo").value = textos.subtitulo || "";
      document.getElementById("adm-c-pix").value = contatos.pix || "";
      document.getElementById("adm-c-suporte").value = contatos.suporte || "";

      formConfig.addEventListener("submit", function (e) {
        e.preventDefault();
        textos.titulo = document.getElementById("adm-c-titulo").value;
        textos.subtitulo = document.getElementById("adm-c-subtitulo").value;
        contatos.pix = document.getElementById("adm-c-pix").value;
        contatos.suporte = document.getElementById("adm-c-suporte").value;

        aplicarTextos();
        configurarPix();
        alert("Configurações salvas!");
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".btn-copiar-js"), function (btn) {
      btn.addEventListener("click", function () {
        var targetId = btn.getAttribute("data-target");
        var txt = document.getElementById(targetId);
        if (txt) {
          txt.select();
          navigator.clipboard.writeText(txt.value);
          alert("Código copiado!");
        }
      });
    });
  }

  function renderizarAdmin() {
    var tbGrupos = document.getElementById("tb-admin-grupos");
    if (tbGrupos) {
      tbGrupos.innerHTML = grupos.map(function (g, i) {
        return (
          '<tr>' +
            '<td><strong>' + escapar(g.nome) + '</strong></td>' +
            '<td>' + g.uni + '</td>' +
            '<td>' + g.cat + '</td>' +
            '<td>' + (g.membros || 0) + '</td>' +
            '<td>' + (g.lotado ? '🔴 Lotado' : '🟢 Ok') + '</td>' +
            '<td>' +
              '<button class="btn-acao btn-sm btn-acao--primary btn-adm-edit-g" data-idx="' + i + '">Editar</button>' +
              '<button class="btn-acao btn-sm btn-acao--secondary btn-adm-toggle-g" data-idx="' + i + '">' + (g.lotado ? 'Desmarcar Lotado' : 'Marcar Lotado') + '</button>' +
              '<button class="btn-acao btn-sm btn-acao--danger btn-adm-del-g" data-idx="' + i + '">Excluir</button>' +
            '</td>' +
          '</tr>'
        );
      }).join("");

      Array.prototype.forEach.call(document.querySelectorAll(".btn-adm-edit-g"), function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          var g = grupos[idx];
          document.getElementById("admin-grupo-index").value = idx;
          document.getElementById("adm-g-nome").value = g.nome || "";
          document.getElementById("adm-g-uni").value = g.uni || "";
          document.getElementById("adm-g-cat").value = g.cat || "";
          document.getElementById("adm-g-url").value = g.url || "";
          document.getElementById("adm-g-membros").value = g.membros || 0;
          document.getElementById("adm-g-desc").value = g.desc || "";
          document.getElementById("adm-g-lotado").checked = Boolean(g.lotado);
          document.getElementById("adm-g-novo").checked = Boolean(g.novo);
        });
      });

      Array.prototype.forEach.call(document.querySelectorAll(".btn-adm-toggle-g"), function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          grupos[idx].lotado = !grupos[idx].lotado;
          montarGrupos();
          renderizarAdmin();
        });
      });

      Array.prototype.forEach.call(document.querySelectorAll(".btn-adm-del-g"), function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          if (confirm("Deseja excluir este grupo?")) {
            grupos.splice(idx, 1);
            montarGrupos();
            renderizarAdmin();
          }
        });
      });
    }

    var tbFestas = document.getElementById("tb-admin-festas");
    if (tbFestas) {
      tbFestas.innerHTML = festas.map(function (f, i) {
        return (
          '<tr>' +
            '<td>' + f.data + '</td>' +
            '<td><strong>' + escapar(f.titulo) + '</strong></td>' +
            '<td>' + f.uni + '</td>' +
            '<td>' + (f.hora || '-') + '</td>' +
            '<td>' +
              '<button class="btn-acao btn-sm btn-acao--primary btn-adm-edit-f" data-idx="' + i + '">Editar</button>' +
              '<button class="btn-acao btn-sm btn-acao--danger btn-adm-del-f" data-idx="' + i + '">Excluir</button>' +
            '</td>' +
          '</tr>'
        );
      }).join("");

      Array.prototype.forEach.call(document.querySelectorAll(".btn-adm-edit-f"), function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          var f = festas[idx];
          document.getElementById("admin-festa-index").value = idx;
          document.getElementById("adm-f-id").value = f.id || "";
          document.getElementById("adm-f-titulo").value = f.titulo || "";
          document.getElementById("adm-f-data").value = f.data || "";
          document.getElementById("adm-f-hora").value = f.hora || "";
          document.getElementById("adm-f-uni").value = f.uni || "";
          document.getElementById("adm-f-midia").value = f.midia || "";
          document.getElementById("adm-f-ingresso").value = f.ingresso || "";
          document.getElementById("adm-f-perfil").value = f.perfil || "";
          document.getElementById("adm-f-desc").value = f.descricao || "";
        });
      });

      Array.prototype.forEach.call(document.querySelectorAll(".btn-adm-del-f"), function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          if (confirm("Deseja excluir esta festa?")) {
            festas.splice(idx, 1);
            montarFestas();
            renderizarAdmin();
          }
        });
      });
    }
  }

  function gerarCodigosExportacao() {
    var areaGrupos = document.getElementById("codigo-grupos-js");
    var areaFestas = document.getElementById("codigo-festas-js");
    var areaTextos = document.getElementById("codigo-textos-js");

    if (areaGrupos) {
      areaGrupos.value = "var ESTADOS = " + JSON.stringify(window.ESTADOS, null, 2) + ";\n\n" +
        "var CIDADES = " + JSON.stringify(window.CIDADES, null, 2) + ";\n\n" +
        "var UNIVERSIDADES_GRUPOS = " + JSON.stringify(unisGrupos, null, 2) + ";\n\n" +
        "var CATEGORIAS = " + JSON.stringify(categorias, null, 2) + ";\n\n" +
        "var GRUPOS = " + JSON.stringify(grupos, null, 2) + ";";
    }

    if (areaFestas) {
      areaFestas.value = "var UNIVERSIDADES = " + JSON.stringify(unis, null, 2) + ";\n\n" +
        "var FESTAS = " + JSON.stringify(festas, null, 2) + ";";
    }

    if (areaTextos) {
      areaTextos.value = "var TEXTOS = " + JSON.stringify(textos, null, 2) + ";\n\n" +
        "var AJUSTES = " + JSON.stringify(ajustes, null, 2) + ";\n\n" +
        "var CONTATOS = " + JSON.stringify(contatos, null, 2) + ";";
    }
  }

  function iniciar() {
    aplicarTextos();
    configurarPix();
    configurarModalMidia();
    montarParceiros();
    montarFestas();
    montarGrupos();
    configurarAbas();
    configurarAdmin();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();