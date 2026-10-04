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

    // Coloque aqui o link do seu Formulário do Google
    var linkFormulario = "https://docs.google.com/forms/d/e/SEU_FORMULARIO_AQUI/viewform";

    var html = "<strong>" + problemas.length + " coisas para arrumar</strong><ul>";
    problemas.forEach(function (p) { html += "<li>" + p.texto + "</li>"; });
    html += "</ul>";
    
    // Botão/Link adicionado abaixo da lista de problemas
    html += '<a class="btn-diagnostico-form" href="' + linkFormulario + '" target="_blank" rel="noopener">PREENCHER FORMULÁRIO</a>';

    caixa.innerHTML = html;
    caixa.hidden = false;
  }

  /* CONFIGURAR BOTÃO DE PIX */
  function configurarPix() {
    var botaoPix = document.getElementById("copiar-pix");
    var pixNumero = document.getElementById("pix-numero");
    var pixRotulo = document.getElementById("pix-rotulo");

    // Pega a chave dos dados/contatos se existir, ou define um fallback padrão
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

  /* POPUP COMISSÁRIO PLURI */
  function configurarPopupComissario() {
    var btnAbrir = document.getElementById("btn-abrir-comissario");
    var modal = document.getElementById("modal-comissario");
    var btnFechar = document.getElementById("modal-comissario-fechar");
    var video = document.getElementById("video-comissario");

    if (!btnAbrir || !modal || !btnFechar || !video) return;

    btnAbrir.addEventListener("click", function () {
      modal.hidden = false;
      video.muted = false;
      var promise = video.play();
      if (promise !== undefined) {
        promise.catch(function () {
          video.muted = true;
          video.play();
        });
      }
    });

    function fecharModal() {
      modal.hidden = true;
      video.pause();
      video.currentTime = 0;
    }

    btnFechar.addEventListener("click", fecharModal);

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        fecharModal();
      }
    });
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
      return String(texto || "").toLowerCase().trim();
    }

    function atualizarCombosFestas() {
      var est = selEstadoFesta ? selEstadoFesta.value : "";
      var cid = selCidadeFesta ? selCidadeFesta.value : "";

      if (selCidadeFesta) {
        if (!est) {
          selCidadeFesta.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
          selCidadeFesta.disabled = true;
        } else {
          var cidsValidas = Object.keys(cidadesData).filter(function (cKey) {
            return cidadesData[cKey].uf === est;
          });
          selCidadeFesta.innerHTML = '<option value="">Todas as Cidades</option>' +
            cidsValidas.map(function (cKey) {
              return '<option value="' + cKey + '">' + cidadesData[cKey].nome + '</option>';
            }).join('');
          selCidadeFesta.disabled = false;
        }
      }

      if (selUniFesta) {
        if (!est) {
          selUniFesta.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
          selUniFesta.disabled = true;
        } else {
          var unisValidas = Object.keys(unisData).filter(function (uKey) {
            var u = unisData[uKey];
            if (cid) return u.uf === est && u.cidade === cid;
            return u.uf === est;
          });
          selUniFesta.innerHTML = '<option value="">Todas as Universidades</option>' +
            unisValidas.map(function (uKey) {
              return '<option value="' + uKey + '">' + unisData[uKey].sigla + ' - ' + unisData[uKey].nome + '</option>';
            }).join('');
          selUniFesta.disabled = false;
        }
      }
    }

    if (selEstadoFesta) {
      selEstadoFesta.innerHTML = '<option value="">Todos os Estados</option>' +
        Object.keys(estadosData).map(function (eKey) {
          return '<option value="' + eKey + '">' + estadosData[eKey].nome + ' (' + eKey + ')</option>';
        }).join('');

      selEstadoFesta.addEventListener("change", function () {
        if (selCidadeFesta) selCidadeFesta.value = "";
        if (selUniFesta) selUniFesta.value = "";
        atualizarCombosFestas();
        paginacao.reiniciar();
        desenhar();
      });
    }

    if (selCidadeFesta) {
      selCidadeFesta.addEventListener("change", function () {
        if (selUniFesta) selUniFesta.value = "";
        atualizarCombosFestas();
        paginacao.reiniciar();
        desenhar();
      });
    }

    if (selUniFesta) {
      selUniFesta.addEventListener("change", function () {
        paginacao.reiniciar();
        desenhar();
      });
    }

    if (buscaFesta) {
      buscaFesta.addEventListener("input", function () {
        paginacao.reiniciar();
        desenhar();
      });
    }

    var paginacao = fazerPaginas({
      caixa: "festas-paginas",
      voltar: "festas-voltar",
      avancar: "festas-avancar",
      onde: "festas-onde"
    }, function () { desenhar(); });

    function desenhar() {
      var est = selEstadoFesta ? selEstadoFesta.value : "";
      var cid = selCidadeFesta ? selCidadeFesta.value : "";
      var uni = selUniFesta ? selUniFesta.value : "";
      var dia = buscaFesta ? buscaFesta.value : "";

      var filtradas = festasBoas.filter(function (f) {
        var uInfo = unisData[f.uni] || {};
        if (est && uInfo.uf !== est) return false;
        if (cid && uInfo.cidade !== cid) return false;
        if (uni && f.uni !== uni) return false;
        if (dia && f.data !== dia) return false;
        return true;
      });

      var exibidas = paginacao.recortar(filtradas);

      if (exibidas.length === 0) {
        lista.innerHTML = "";
        var vazio = document.getElementById("festas-vazio");
        if (vazio) {
          vazio.textContent = "Nenhuma festa encontrada para esse filtro.";
          vazio.hidden = false;
        }
        return;
      }

      var vazioEl = document.getElementById("festas-vazio");
      if (vazioEl) vazioEl.hidden = true;

      var DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

      lista.innerHTML = exibidas.map(function (f) {
        var p = partesDaData(f.data);
        var uInfo = unisData[f.uni] || {};
        var nomeUni = uInfo.sigla || f.uni;

        var mMidia = "";
        if (f.flyer || f.video) {
          var eVideo = !!f.video;
          var srcMidia = f.video || f.flyer;

          mMidia = '<div class="festa__mini-container" data-midia-src="' + srcMidia + '" data-midia-tipo="' + (eVideo ? 'video' : 'imagem') + '">' +
            (eVideo ?
              '<video class="festa__mini-media" src="' + srcMidia + '#t=0.1" preload="metadata" muted></video><div class="festa__play-icon">▶</div>' :
              '<img class="festa__mini-media" src="' + srcMidia + '" alt="Flyer" loading="lazy">'
            ) +
          '</div>';
        }

        return '<li class="festa">' +
          '<div class="festa__data">' +
            '<span class="festa__semana">' + DIAS_SEMANA[p.semana] + '</span>' +
            '<span class="festa__dia">' + dois(p.dia) + '</span>' +
            '<span class="festa__mes">' + MESES[p.mes - 1] + '</span>' +
          '</div>' +
          '<div class="festa__corpo">' +
            '<p class="festa__uni">' + escapar(nomeUni) + (f.hora ? ' • <span class="festa__hora">' + f.hora + '</span>' : '') + '</p>' +
            '<h3 class="festa__titulo">' + escapar(f.titulo) + '</h3>' +
            (f.desc ? '<p class="festa__descricao">' + escapar(f.desc) + '</p>' : '') +
            '<div class="festa__links">' +
              (f.ingresso ? '<a class="festa__link festa__link--ingresso" href="' + f.ingresso + '" target="_blank" rel="noopener">Comprar Ingresso</a>' : '') +
              (f.instagram ? '<a class="festa__link festa__link--perfil" href="' + f.instagram + '" target="_blank" rel="noopener">Instagram</a>' : '') +
            '</div>' +
          '</div>' +
          mMidia +
        '</li>';
      }).join("");

      Array.prototype.forEach.call(lista.querySelectorAll(".festa__mini-container"), function (el) {
        el.addEventListener("click", function () {
          var src = el.getAttribute("data-midia-src");
          var tipo = el.getAttribute("data-midia-tipo");
          abrirModalMidia(src, tipo);
        });
      });
    }

    desenhar();
    return festasBoas.length;
  }

  /* MODAL DE MÍDIA */
  function abrirModalMidia(src, tipo) {
    var modal = document.getElementById("modal-midia");
    var container = document.getElementById("modal-container-midia");
    if (!modal || !container) return;

    if (tipo === "video") {
      container.innerHTML = '<video class="modal-midia__midia" src="' + src + '" controls autoplay playsinline></video>';
    } else {
      container.innerHTML = '<img class="modal-midia__midia" src="' + src + '" alt="Mídia da festa em tela cheia">';
    }

    modal.hidden = false;
  }

  function configurarModal() {
    var modal = document.getElementById("modal-midia");
    var fechar = document.getElementById("modal-fechar");
    var container = document.getElementById("modal-container-midia");

    if (!modal || !fechar) return;

    function fecharModal() {
      modal.hidden = true;
      if (container) container.innerHTML = "";
    }

    fechar.addEventListener("click", fecharModal);

    modal.addEventListener("click", function (e) {
      if (e.target === modal) fecharModal();
    });
  }

  function montarGrupos() {
    var lista = document.getElementById("lista");
    if (!lista) return 0;

    var selEstado = document.getElementById("select-estado");
    var selCidade = document.getElementById("select-cidade");
    var selUni    = document.getElementById("select-uni");
    var busca     = document.getElementById("busca");
    var contagem  = document.getElementById("contagem");
    var chips     = document.getElementById("chips");

    var estadosData = window.ESTADOS || {};
    var cidadesData = window.CIDADES || {};
    var unisData = window.UNIVERSIDADES || {};

    var catAtiva = "";

    function atualizarCombosGrupos() {
      var est = selEstado ? selEstado.value : "";
      var cid = selCidade ? selCidade.value : "";

      if (selCidade) {
        if (!est) {
          selCidade.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
          selCidade.disabled = true;
        } else {
          var cidsValidas = Object.keys(cidadesData).filter(function (cKey) {
            return cidadesData[cKey].uf === est;
          });
          selCidade.innerHTML = '<option value="">Todas as Cidades</option>' +
            cidsValidas.map(function (cKey) {
              return '<option value="' + cKey + '">' + cidadesData[cKey].nome + '</option>';
            }).join('');
          selCidade.disabled = false;
        }
      }

      if (selUni) {
        if (!est) {
          selUni.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
          selUni.disabled = true;
        } else {
          var unisValidas = Object.keys(unisData).filter(function (uKey) {
            var u = unisData[uKey];
            if (cid) return u.uf === est && u.cidade === cid;
            return u.uf === est;
          });
          selUni.innerHTML = '<option value="">Todas as Universidades</option>' +
            unisValidas.map(function (uKey) {
              return '<option value="' + uKey + '">' + unisData[uKey].sigla + ' - ' + unisData[uKey].nome + '</option>';
            }).join('');
          selUni.disabled = false;
        }
      }
    }

    if (selEstado) {
      selEstado.innerHTML = '<option value="">Todos os Estados</option>' +
        Object.keys(estadosData).map(function (eKey) {
          return '<option value="' + eKey + '">' + estadosData[eKey].nome + ' (' + eKey + ')</option>';
        }).join('');

      selEstado.addEventListener("change", function () {
        if (selCidade) selCidade.value = "";
        if (selUni) selUni.value = "";
        atualizarCombosGrupos();
        paginacao.reiniciar();
        desenhar();
      });
    }

    if (selCidade) {
      selCidade.addEventListener("change", function () {
        if (selUni) selUni.value = "";
        atualizarCombosGrupos();
        paginacao.reiniciar();
        desenhar();
      });
    }

    if (selUni) {
      selUni.addEventListener("change", function () {
        paginacao.reiniciar();
        desenhar();
      });
    }

    if (chips) {
      var htmlChips = '<button class="chip" type="button" data-cat="" aria-pressed="true">Todos</button>';
      Object.keys(categorias).forEach(function (cKey) {
        htmlChips += '<button class="chip" type="button" data-cat="' + cKey + '" aria-pressed="false">' + categorias[cKey].nome + '</button>';
      });
      chips.innerHTML = htmlChips;

      chips.addEventListener("click", function (e) {
        var btn = e.target.closest(".chip");
        if (!btn) return;
        catAtiva = btn.getAttribute("data-cat") || "";

        Array.prototype.forEach.call(chips.querySelectorAll(".chip"), function (c) {
          c.setAttribute("aria-pressed", c === btn ? "true" : "false");
        });

        paginacao.reiniciar();
        desenhar();
      });
    }

    if (busca) {
      busca.addEventListener("input", function () {
        paginacao.reiniciar();
        desenhar();
      });
    }

    var paginacao = fazerPaginas({
      caixa: "grupos-paginas",
      voltar: "grupos-voltar",
      avancar: "grupos-avancar",
      onde: "grupos-onde"
    }, function () { desenhar(); });

    function desenhar() {
      var est = selEstado ? selEstado.value : "";
      var cid = selCidade ? selCidade.value : "";
      var uni = selUni ? selUni.value : "";
      var termo = busca ? busca.value.toLowerCase().trim() : "";

      var filtrados = gruposBons.filter(function (g) {
        var uInfo = unisData[g.uni] || {};
        if (est && uInfo.uf !== est) return false;
        if (cid && uInfo.cidade !== cid) return false;
        if (uni && g.uni !== uni) return false;
        if (catAtiva && g.cat !== catAtiva) return false;
        if (termo && g.nome.toLowerCase().indexOf(termo) === -1 && (g.desc || "").toLowerCase().indexOf(termo) === -1) return false;
        return true;
      });

      if (contagem) {
        contagem.textContent = filtrados.length + " grupos encontrados";
      }

      var exibidos = paginacao.recortar(filtrados);

      if (exibidos.length === 0) {
        lista.innerHTML = "";
        var vazio = document.getElementById("vazio");
        if (vazio) vazio.hidden = false;
        return;
      }

      var vazioEl = document.getElementById("vazio");
      if (vazioEl) vazioEl.hidden = true;

      lista.innerHTML = exibidos.map(function (g) {
        var catInfo = categorias[g.cat] || {};
        var cor = catInfo.cor || "var(--verde)";

        return '<li class="item" style="--cor: ' + cor + ';">' +
          '<a class="grupo" href="' + g.url + '" target="_blank" rel="noopener">' +
            '<div class="grupo__topo-linha">' +
              '<span class="grupo__nome">' + escapar(g.nome) + '</span>' +
            '</div>' +
            (g.desc ? '<span class="grupo__desc">' + escapar(g.desc) + '</span>' : '') +
            '<div class="grupo__meta">' +
              '<span class="ponto"></span>' +
              '<span>' + (catInfo.nome || g.cat) + '</span>' +
              (g.membros ? ' • <span>' + g.membros + ' membros</span>' : '') +
            '</div>' +
          '</a>' +
        '</li>';
      }).join("");
    }

    /* ATUALIZAR PAINEL */
    var elGrupos = document.getElementById("painel-grupos");
    var elMembros = document.getElementById("painel-membros");
    var elMedia = document.getElementById("painel-media");

    var totalMembros = 0;
    gruposBons.forEach(function (g) {
      if (g.membros) totalMembros += Number(g.membros) || 0;
    });

    if (elGrupos) elGrupos.textContent = gruposBons.length;
    if (elMembros) elMembros.textContent = totalMembros.toLocaleString("pt-BR");
    if (elMedia && gruposBons.length > 0) {
      elMedia.textContent = Math.round(totalMembros / gruposBons.length).toLocaleString("pt-BR");
    }

    desenhar();
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

    if (!abaGrupos || !abaFestas || !secGrupos || !secFestas) return;

    function alternar(mostrarFestas) {
      abaGrupos.setAttribute("aria-selected", !mostrarFestas);
      abaFestas.setAttribute("aria-selected", mostrarFestas);
      abaGrupos.tabIndex = mostrarFestas ? -1 : 0;
      abaFestas.tabIndex = mostrarFestas ? 0 : -1;

      secGrupos.hidden = mostrarFestas;
      secFestas.hidden = !mostrarFestas;
    }

    abaGrupos.addEventListener("click", function () { alternar(false); });
    abaFestas.addEventListener("click", function () { alternar(true); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    mostrarProblemas();
    aplicarTextos();
    configurarPix();
    configurarPopupComissario();
    montarParceiros();
    configurarModal();

    var numGrupos = montarGrupos();
    var numFestas = montarFestas();

    configurarAbas(numGrupos, numFestas);
  });
})();