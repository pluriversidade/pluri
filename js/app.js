/* ═══════════════════════════════════════════════════════════════════════════
   O FUNCIONAMENTO DA PÁGINA
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* -------------------------------------------------------------------------
     RECUPERAÇÃO DA CHAVE DE API SEGURA (CONFIG.JS)
     ------------------------------------------------------------------------- */
  var GEMINI_API_KEY = (typeof CONFIG !== "undefined" && CONFIG.GEMINI_API_KEY) ? CONFIG.GEMINI_API_KEY : "";

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
     BUSCA INTELIGENTE COM IA (GEMINI)
     ------------------------------------------------------------------------- */
  async function buscarGrupoComIA(termoUsuario) {
    var resultadoDiv = document.getElementById("resultado-ia");
    if (!resultadoDiv) return;

    if (!GEMINI_API_KEY) {
      resultadoDiv.hidden = false;
      resultadoDiv.innerHTML = '<div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">⚠️ <strong>Erro:</strong> Chave de API não configurada no arquivo <code>js/config.js</code>.</div>';
      return;
    }

    resultadoDiv.hidden = false;
    resultadoDiv.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--tinta);">🤖 Analisando os melhores grupos no repositório nacional...</p>';

    var listaGruposPrompt = gruposBons.map(function (g) {
      var u = unis[g.uni] ? unis[g.uni].nome : (g.uni || "Geral");
      return {
        nome: g.nome,
        universidade: u,
        descricao: g.desc,
        url: g.url
      };
    });

    var prompt = `
      Você é um assistente inteligente do repositório nacional de grupos de WhatsApp de universidades do Brasil.
      
      ATENÇÃO: Como o site atende diversas universidades do país, o usuário DEVE especificar qual é a universidade/faculdade dele e o que deseja publicar.

      Lista de grupos cadastrados:
      ${JSON.stringify(listaGruposPrompt)}

      O usuário digitou: "${termoUsuario}"

      Instruções:
      1. Se o usuário NÃO informou a universidade/faculdade ou o assunto está vago demais, retorne um JSON puro com: { "precisa_detalhar": true, "mensagem": "Por favor, explique melhor o que deseja enviar e informe qual é a sua universidade (ex: UFMG, USP, UFRJ) para encontrarmos o grupo certo!" }
      2. Se ele especificou corretamente, escolha até os 3 melhores grupos correspondentes e retorne um JSON com: { "precisa_detalhar": false, "grupos": [{ "nome": "...", "url": "...", "motivo": "Explicação curta" }] }
      
      Retorne estritamente o JSON sem blocos de markdown adicionais.
    `;

    try {
      var response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      var data = await response.json();
      var textoResposta = data.candidates[0].content.parts[0].text;
      textoResposta = textoResposta.replace(/```json/g, "").replace(/```/g, "").trim();

      var res = JSON.parse(textoResposta);

      if (res.precisa_detalhar) {
        resultadoDiv.innerHTML = '<div style="background: #fff3cd; color: #856404; padding: 1rem; border-radius: 8px; border: 1px solid #ffeeba;">⚠️ <strong>Atenção:</strong> ' + escapar(res.mensagem) + '</div>';
        return;
      }

      if (!res.grupos || res.grupos.length === 0) {
        resultadoDiv.innerHTML = '<p style="text-align: center; padding: 1rem;">Nenhum grupo encontrado para essa busca. Tente detalhar melhor a universidade e o assunto!</p>';
        return;
      }

      var html = '<div style="background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #ddd;"><h4 style="margin-bottom: 0.8rem; color: var(--tinta);">💡 Melhores grupos indicados para você:</h4><ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.8rem;">';
      
      res.grupos.forEach(function (g) {
        html += '<li style="background: #fdfbf7; padding: 0.8rem; border-radius: 6px; border-left: 4px solid var(--terracota, #B24232);">' +
                  '<strong>' + escapar(g.nome) + '</strong>' +
                  '<p style="font-size: 0.9rem; margin: 0.3rem 0; color: #555;">' + escapar(g.motivo) + '</p>' +
                  '<a href="' + g.url + '" target="_blank" rel="noopener" class="grupo__btn-entrar" style="display: inline-block; margin-top: 0.4rem; padding: 0.4rem 0.8rem; font-size: 0.85rem; text-decoration: none;">ENTRAR NO GRUPO 🚀</a>' +
                '</li>';
      });
      
      html += '</ul></div>';
      resultadoDiv.innerHTML = html;

    } catch (err) {
      console.error("Erro na IA:", err);
      resultadoDiv.innerHTML = '<p style="color: red; text-align: center;">Erro ao consultar a IA. Verifique sua chave e tente novamente.</p>';
    }
  }

  function configurarBuscaIA() {
    var btnIa = document.getElementById("btn-busca-ia");
    var buscaInput = document.getElementById("busca");

    if (btnIa && buscaInput) {
      btnIa.addEventListener("click", function () {
        var texto = buscaInput.value.trim();
        if (texto) {
          buscarGrupoComIA(texto);
        } else {
          alert("Por favor, digite o que você quer compartilhar e de qual universidade você é!");
        }
      });

      buscaInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          btnIa.click();
        }
      });
    }
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
     MODAL DE MÍDIA (FLYER / VÍDEO EM TELA CHEIA)
     ------------------------------------------------------------------------- */
  function abrirModalMidia(midiaSrc, tipo) {
    var modal = document.getElementById("modal-midia");
    var container = document.getElementById("modal-container-midia");
    if (!modal || !container) return;

    if (tipo === "video") {
      container.innerHTML = '<video class="modal-midia__midia" src="' + midiaSrc + '" controls autoplay playsinline></video>';
    } else {
      container.innerHTML = '<img class="modal-midia__midia" src="' + midiaSrc + '" alt="Flyer Ampliado">';
    }

    modal.hidden = false;
  }

  function fecharModalMidia() {
    var modal = document.getElementById("modal-midia");
    var container = document.getElementById("modal-container-midia");
    if (!modal || !container) return;

    modal.hidden = true;
    container.innerHTML = "";
  }

  /* -------------------------------------------------------------------------
     MODAL COMISSÁRIO PLURI
     ------------------------------------------------------------------------- */
  function configurarModalComissario() {
    var btnInfo = document.getElementById("btn-comissario-info");
    var modal = document.getElementById("modal-comissario");
    var btnFechar = document.getElementById("modal-comissario-fechar");
    var video = document.getElementById("video-comissario");

    if (!btnInfo || !modal) return;

    btnInfo.addEventListener("click", function () {
      modal.hidden = false;
      if (video) {
        video.currentTime = 0;
        video.play().catch(function () {});
      }
    });

    if (btnFechar) {
      btnFechar.addEventListener("click", function () {
        modal.hidden = true;
        if (video) video.pause();
      });
    }

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.hidden = true;
        if (video) video.pause();
      }
    });
  }

  /* -------------------------------------------------------------------------
     ABAS DA PÁGINA (GRUPOS / FESTAS)
     ------------------------------------------------------------------------- */
  function configurarAbas() {
    var abaGrupos = document.getElementById("aba-grupos");
    var abaFestas = document.getElementById("aba-festas");
    var secaoGrupos = document.getElementById("secao-grupos");
    var secaoFestas = document.getElementById("secao-festas");

    if (!abaGrupos || !abaFestas || !secaoGrupos || !secaoFestas) return;

    function ativarAba(qual) {
      var ehGrupos = qual === "grupos";

      abaGrupos.setAttribute("aria-selected", ehGrupos);
      abaGrupos.setAttribute("tabindex", ehGrupos ? "0" : "-1");
      secaoGrupos.hidden = !ehGrupos;

      abaFestas.setAttribute("aria-selected", !ehGrupos);
      abaFestas.setAttribute("tabindex", !ehGrupos ? "0" : "-1");
      secaoFestas.hidden = ehGrupos;

      if (history.replaceState) {
        var hash = ehGrupos ? "#grupos" : "#festas";
        history.replaceState(null, "", hash);
      }
    }

    abaGrupos.addEventListener("click", function () { ativarAba("grupos"); });
    abaFestas.addEventListener("click", function () { ativarAba("festas"); });

    if (location.hash === "#festas") {
      ativarAba("festas");
    }
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
              '<p class="festa__descricao">' + escapar(f.resumo || f.descricao || f.desc || "") + '</p>' +
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
     SEÇÃO DE DETALHES DA FESTA (FESTA.HTML)
     ------------------------------------------------------------------------- */
  window.montarDetalheFesta = function () {
    var container = document.getElementById("detalhe-festa-container");
    if (!container) return;

    var hash = location.hash.replace("#", "").trim();
    if (!hash) {
      container.innerHTML = '<p style="text-align: center; color: var(--tinta-fraca); padding: 2rem;">Nenhuma festa selecionada. <a href="index.html#festas">Voltar para a agenda</a>.</p>';
      return;
    }

    var festa = festasBoas.find(function (f) {
      return slugify(f.titulo) === hash;
    });

    if (!festa) {
      container.innerHTML = '<p style="text-align: center; color: var(--tinta-fraca); padding: 2rem;">Festa não encontrada. <a href="index.html#festas">Voltar para a agenda</a>.</p>';
      return;
    }

    var d = partesDaData(festa.data);
    var u = (window.UNIVERSIDADES || {})[festa.uni] || { nome: festa.uni || "" };
    var dataFormatada = d ? dois(d.dia) + "/" + dois(d.mes) + "/" + d.ano : festa.data;
    var corFesta = festa.cor || "var(--terracota)";

    var metaTitle = document.getElementById("meta-title");
    var metaDesc = document.getElementById("meta-desc");
    var ogTitle = document.getElementById("og-title");
    var ogDesc = document.getElementById("og-desc");
    var ogImage = document.getElementById("og-image");

    var tituloCompleto = festa.titulo + " — Pluriversidade";
    var descricaoCompleta = festa.descricao || festa.desc || "Confira os detalhes completos desta festa universitária.";

    if (metaTitle) metaTitle.textContent = tituloCompleto;
    if (metaDesc) metaDesc.content = descricaoCompleta;
    if (ogTitle) ogTitle.content = tituloCompleto;
    if (ogDesc) ogDesc.content = descricaoCompleta;
    if (ogImage && festa.midia && !/\.(mp4|webm|ogg)$/i.test(festa.midia)) {
      ogImage.content = location.origin + "/" + festa.midia;
    }

    var midiaHtml = "";
    if (festa.midia) {
      if (/\.(mp4|webm|ogg)$/i.test(festa.midia)) {
        midiaHtml = '<div style="margin: 1.2rem 0; text-align: center;"><video src="' + festa.midia + '" controls autoplay muted playsinline style="max-width: 100%; max-height: 450px; border-radius: 12px; background: #000;"></video></div>';
      } else {
        midiaHtml = '<div style="margin: 1.2rem 0; text-align: center;"><img src="' + festa.midia + '" alt="' + escapar(festa.titulo) + '" style="max-width: 100%; max-height: 450px; border-radius: 12px; object-fit: contain;"></div>';
      }
    }

    var mensagemComissario = encodeURIComponent("Oi galera da Pluri*, quero ser comissário de venda de ingressos da festa *" + festa.titulo + "*, como faço?");
    var linkComissario = "https://wa.me/5531991579687?text=" + mensagemComissario;

    var urlPaginaAtual = window.location.href;
    var textoWhatsApp = 
      "*🎉 " + festa.titulo.toUpperCase() + " *\n\n" +
      "📅 *Data:* " + dataFormatada + (festa.hora ? " às " + festa.hora : "") + "\n" +
      "🏫 *Universidade:* " + u.nome + "\n\n" +
      descricaoCompleta + "\n\n" +
      (pareceLink(festa.ingresso) ? "🎟️ *Ingresso:* " + festa.ingresso + "\n" : "") +
      "🔗 *Saiba mais e compartilhe:* " + urlPaginaAtual;

    var linkCompartilharWhatsApp = "https://api.whatsapp.com/send?text=" + encodeURIComponent(textoWhatsApp);

    container.innerHTML =
      '<div class="bloco" style="border-left: 6px solid ' + corFesta + '; padding: 1.5rem;">' +
        '<p style="font-family: var(--mono); font-size: .75rem; text-transform: uppercase; color: ' + corFesta + '; margin: 0 0 .3rem;">' + escapar(u.nome) + (festa.hora ? ' • ' + escapar(festa.hora) : '') + '</p>' +
        '<h2 style="font-size: 1.8rem; margin: 0 0 .5rem;">' + escapar(festa.titulo) + '</h2>' +
        '<p style="font-size: 1.05rem; font-family: var(--mono); color: var(--tinta-fraca); margin: 0 0 1rem;">📅 Data: ' + dataFormatada + '</p>' +
        midiaHtml +
        '<div style="margin: 1.5rem 0;">' +
          '<h3 style="font-size: 1.1rem; margin-bottom: .5rem; color: var(--tinta);">📝 Descrição Completa</h3>' +
          '<p style="font-size: 1.05rem; line-height: 1.6; margin: 0; white-space: pre-line;">' + escapar(festa.descricao || festa.desc || "") + '</p>' +
        '</div>' +
        '<div style="display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1.5rem;">' +
          (pareceLink(festa.ingresso) ? '<a class="festa__link festa__link--ingresso" href="' + festa.ingresso + '" target="_blank" rel="noopener" style="font-size: 1rem; padding: .7rem 1.2rem;">Comprar Ingresso 🎟️</a>' : '') +
          (pareceLink(festa.perfil) ? '<a class="festa__link festa__link--perfil" href="' + festa.perfil + '" target="_blank" rel="noopener" style="font-size: 1rem; padding: .7rem 1.2rem;">Instagram Oficial 📸</a>' : '') +
          '<a class="festa__link festa__link--grupo" href="' + linkComissario + '" target="_blank" rel="noopener" style="font-size: 1rem; padding: .7rem 1.2rem;">Quero ser Comissário 🤝</a>' +
          '<a class="festa__link festa__link--ingresso" href="' + linkCompartilharWhatsApp + '" target="_blank" rel="noopener" style="font-size: 1rem; padding: .7rem 1.2rem; background: #25D366; border-color: #25D366; color: #fff;">Compartilhar no WhatsApp 🔗</a>' +
        '</div>' +
      '</div>';
  };

  /* -------------------------------------------------------------------------
     SEÇÃO DE GRUPOS (INDEX)
     ------------------------------------------------------------------------- */
  var paginasGrupos;

  function montarGrupos() {
    var lista = document.getElementById("lista");
    if (!lista) return;

    var selEstado = document.getElementById("select-estado");
    var selCidade = document.getElementById("select-cidade");
    var selUni = document.getElementById("select-uni");
    var buscaInput = document.getElementById("busca");
    var chipsCaixa = document.getElementById("chips");
    var contagemEl = document.getElementById("contagem");
    var vazioEl = document.getElementById("vazio");

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

    var catSel = "todas";
    var termoBusca = "";

    paginasGrupos = fazerPaginas({
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

    if (buscaInput) {
      buscaInput.addEventListener("input", function () {
        termoBusca = simples(buscaInput.value);
        paginasGrupos.reiniciar();
        desenhar();
      });
    }

    function renderChips(visiveisAtuais) {
      if (!chipsCaixa) return;

      var chavesCats = Object.keys(categorias);
      var html = '';

      html +=
        '<div class="chip-grupo chip-grupo--todas" aria-pressed="' + (catSel === "todas") + '">' +
          '<button class="chip-conteudo" type="button" data-cat="todas">' +
            '<span class="chip-nome">🔥 Todas as categorias</span>' +
          '</button>' +
          '<button class="btn-share-cat" type="button" data-share-cat="todas" title="Compartilhar categoria no WhatsApp">🔗</button>' +
        '</div>';

      chavesCats.forEach(function (catKey) {
        var cat = categorias[catKey];
        var pressed = catSel === catKey;
        var icone = cat.icone || cat.img || "";

        html +=
          '<div class="chip-grupo" aria-pressed="' + pressed + '">' +
            '<button class="chip-conteudo" type="button" data-cat="' + catKey + '">' +
              (icone ? '<img class="chip-img" src="' + icone + '" alt="" loading="lazy">' : '') +
              '<span class="chip-nome">' + escapar(cat.nome) + '</span>' +
            '</button>' +
            '<button class="btn-share-cat" type="button" data-share-cat="' + catKey + '" title="Compartilhar categoria ' + escapar(cat.nome) + ' no WhatsApp">🔗</button>' +
          '</div>';
      });

      chipsCaixa.innerHTML = html;

      Array.prototype.forEach.call(chipsCaixa.querySelectorAll(".chip-conteudo"), function (btn) {
        btn.addEventListener("click", function () {
          catSel = btn.getAttribute("data-cat");
          paginasGrupos.reiniciar();
          desenhar();
        });
      });

      Array.prototype.forEach.call(chipsCaixa.querySelectorAll("[data-share-cat]"), function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var categoriaKey = btn.getAttribute("data-share-cat");
          var nomeCat = categoriaKey === "todas" ? "Todas as Categorias" : (categorias[categoriaKey] ? categorias[categoriaKey].nome : categoriaKey);
          
          var urlSite = location.origin + location.pathname;
          var textoCompartilhamento =
            "*Ei*, confira esses grupos úteis da categoria *" + nomeCat + "* na Pluriversidade:\n" +
            urlSite + "\n\n" +
            "*Pluriversidade.com.br*";

          var urlWhatsapp = "https://api.whatsapp.com/send?text=" + encodeURIComponent(textoCompartilhamento);
          window.open(urlWhatsapp, "_blank");
        });
      });
    }

    function desenhar() {
      var visiveis = gruposBons.filter(function (g) {
        var uniDoGrupo = unisData[g.uni];
        var cidDoGrupo = uniDoGrupo ? cidadesData[uniDoGrupo.cidade] : null;

        var bateEstado = !estadoSel || (cidDoGrupo && cidDoGrupo.estado === estadoSel);
        var bateCidade = !cidadeSel || (uniDoGrupo && uniDoGrupo.cidade === cidadeSel);
        var bateUni = !uniSel || g.uni === uniSel || simples(g.uni) === simples(uniSel);
        var bateCat = catSel === "todas" || g.cat === catSel;
        var bateBusca = !termoBusca || simples(g.nome).indexOf(termoBusca) !== -1 || simples(g.desc).indexOf(termoBusca) !== -1;

        return bateEstado && bateCidade && bateUni && bateCat && bateBusca;
      });

      renderChips(visiveis);

      lista.innerHTML = paginasGrupos.recortar(visiveis).map(function (g) {
        var cat = categorias[g.cat] || { nome: g.cat, cor: "var(--verde)" };
        var lotado = Boolean(g.lotado);
        var novo = Boolean(g.novo);

        return (
          '<li class="item" style="--cor: ' + cat.cor + '">' +
            '<div class="grupo__conteudo">' +
              '<a class="grupo" href="' + g.url + '" target="_blank" rel="noopener">' +
                '<div class="grupo__topo-linha">' +
                  '<span class="grupo__nome">' + escapar(g.nome) + '</span>' +
                  (lotado ? '<span class="etiqueta etiqueta--lotado">lotado</span>' : '') +
                  (novo ? '<span class="etiqueta etiqueta--novo">novo</span>' : '') +
                '</div>' +
                (g.desc ? '<span class="grupo__desc">' + escapar(g.desc) + '</span>' : '') +
                '<div class="grupo__meta">' +
                  '<span class="ponto"></span>' +
                  '<span>' + escapar(cat.nome) + '</span>' +
                  (g.membros ? '<span>• ' + g.membros + ' membros</span>' : '') +
                '</div>' +
              '</a>' +
              '<div class="grupo__acoes">' +
                '<button class="grupo__btn-share btn-compartilhar-grupo" type="button" data-url="' + g.url + '" data-nome="' + escapar(g.nome) + '" title="Compartilhar Grupo no WhatsApp">🔗 <span class="texto-vertical">COMPARTILHAR</span></button>' +
                '<a class="reportar" href="https://wa.me/5531991579687?text=' + encodeURIComponent("Oi! O link do grupo *" + g.nome + "* (" + g.url + ") parece estar com problema.") + '" target="_blank" rel="noopener" title="Reportar link quebrado">⚠️ <span class="texto-vertical">REPORTAR</span></a>' +
              '</div>' +
            '</div>' +
            '<a class="grupo__btn-entrar ' + (lotado ? 'grupo__btn-entrar--lotado' : '') + '" href="' + g.url + '" target="_blank" rel="noopener">' +
              (lotado ? 'GRUPO LOTADO (ENTRE NA LISTA DE ESPERA)' : 'ENTRAR NO GRUPO DO WHATSAPP') +
            '</a>' +
          '</li>'
        );
      }).join("");

      if (vazioEl) {
        vazioEl.hidden = visiveis.length > 0;
        if (visiveis.length === 0) {
          vazioEl.textContent = "Nenhum grupo encontrado com os filtros selecionados.";
        }
      }

      var contaAba = document.getElementById("aba-grupos-conta");
      if (contaAba) contaAba.textContent = visiveis.length;

      var totalMembros = visiveis.reduce(function (acc, g) {
        return acc + (Number(g.membros) || 0);
      }, 0);

      var mediaMembros = visiveis.length > 0 ? Math.round(totalMembros / visiveis.length) : 0;

      var elPainelGrupos = document.getElementById("painel-grupos");
      var elPainelMembros = document.getElementById("painel-membros");
      var elPainelMedia = document.getElementById("painel-media");

      if (elPainelGrupos) elPainelGrupos.textContent = visiveis.length;
      if (elPainelMembros) elPainelMembros.textContent = totalMembros > 0 ? totalMembros.toLocaleString("pt-BR") : "—";
      if (elPainelMedia) elPainelMedia.textContent = mediaMembros > 0 ? mediaMembros.toLocaleString("pt-BR") : "—";

      if (contagemEl) {
        contagemEl.innerHTML = 'Mostrando <strong>' + visiveis.length + '</strong> grupo' + (visiveis.length === 1 ? '' : 's');
      }

      Array.prototype.forEach.call(document.querySelectorAll(".btn-compartilhar-grupo"), function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var urlGrupo = btn.getAttribute("data-url");
          var nomeGrupo = btn.getAttribute("data-nome");

          var textoCompartilhamento =
            "*Ei*, achei esse grupo do WhatsApp e resolvi *compartilhar*:\n\n" +
            "*" + nomeGrupo + "*\n" +
            urlGrupo + "\n\n" +
            "*Pluriversidade.com.br*";

          var urlWhatsapp = "https://api.whatsapp.com/send?text=" + encodeURIComponent(textoCompartilhamento);
          window.open(urlWhatsapp, "_blank");
        });
      });
    }

    renderEstados();
    atualizarSelectCidades();
    atualizarSelectUnis();
    desenhar();
  }

  /* -------------------------------------------------------------------------
     INICIALIZAÇÃO GLOBAL DO APLICATIVO
     ------------------------------------------------------------------------- */
  window.addEventListener("DOMContentLoaded", function () {
    aplicarTextos();
    configurarPix();
    montarParceiros();
    configurarAbas();
    configurarModalComissario();
    configurarBuscaIA();

    var fecharModalBtn = document.getElementById("modal-fechar");
    var modalMidiaDiv = document.getElementById("modal-midia");

    if (fecharModalBtn) {
      fecharModalBtn.addEventListener("click", fecharModalMidia);
    }
    if (modalMidiaDiv) {
      modalMidiaDiv.addEventListener("click", function (e) {
        if (e.target === modalMidiaDiv) fecharModalMidia();
      });
    }

    montarGrupos();
    montarFestas();

    if (editando && problemas.length > 0) {
      var diag = document.getElementById("diagnostico");
      if (diag) {
        diag.hidden = false;
        diag.innerHTML =
          "<b>Avisos de dados:</b><ul>" +
          problemas.map(function (p) {
            return "<li>[" + p.arquivo + "] " + p.texto + "</li>";
          }).join("") +
          "</ul>";
      }
    }
  });

})();