/* ═══════════════════════════════════════════════════════════════════════════
   GERADOR DE LISTAS DIVIDIDAS PARA WHATSAPP
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var LIMITE_WHATSAPP_CHARS = 3800; // Limite seguro para garantir links clicáveis

  var grupos = window.GRUPOS || [];
  var categorias = window.CATEGORIAS || {};
  var unis = window.UNIVERSIDADES || {};

  function pareceLink(url) {
    return typeof url === "string" && /^https?:\/\/.+/.test(url.trim());
  }

  function slugify(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* Filtra apenas grupos válidos da UFMG que não estejam lotados */
  function obterGruposEntraveis(siglaUni) {
    var uniAlvo = (siglaUni || "ufmg").toLowerCase();
    return grupos.filter(function (g) {
      var bateUni = g && g.uni && g.uni.toLowerCase() === uniAlvo;
      var temLink = pareceLink(g.url);
      var naoLotado = !g.lotado;
      return bateUni && temLink && naoLotado;
    });
  }

  /* Agrupa a lista em blocos de categoria */
  function gerarBlocosPorCategoria(gruposFiltrados, nomeUni) {
    var porCat = {};

    gruposFiltrados.forEach(function (g) {
      if (!porCat[g.cat]) {
        porCat[g.cat] = [];
      }
      porCat[g.cat].push(g);
    });

    var blocos = [];

    Object.keys(porCat).forEach(function (catKey) {
      var listaCat = porCat[catKey];
      if (listaCat.length === 0) return;

      var catObj = categorias[catKey] || { nome: catKey };
      var tituloCat = catObj.nome.toUpperCase();

      var textoBloco = "════════════════════════\n" +
        "*" + tituloCat + "* - [" + listaCat.length + " " + (listaCat.length === 1 ? "grupo" : "grupos") + "]\n" +
        "_(Grupos não listados nesta categoria estão lotados)_\n\n";

      listaCat.forEach(function (g) {
        var slugGrupo = slugify(g.nome);
        var urlCard = "https://pluriversidade.github.io/pluri/#grupos/" + slugGrupo;
        var infoMembros = g.membros ? "[" + g.membros + " membros]" : "[Grupo aberto]";

        textoBloco += "• *" + g.nome + "* - " + infoMembros + "\n" + urlCard + "\n\n";
      });

      blocos.push(textoBloco);
    });

    return blocos;
  }

  /* Divide os blocos em partes menores respeitando o limite do WhatsApp */
  function fatiarTextoPorTamanho(blocos, nomeUni) {
    var cabecalhoBase = "*LISTA COMPLETA COM OS LINKS DOS GRUPOS DA " + nomeUni.toUpperCase() + "*";
    var rodapeBase = "════════════════════════\n*Compartilhe essa lista em todos os grupos da " + nomeUni.toUpperCase() + "*";

    var partes = [];
    var parteAtual = "";

    blocos.forEach(function (bloco) {
      if ((parteAtual + bloco + rodapeBase).length > LIMITE_WHATSAPP_CHARS && parteAtual.length > 0) {
        partes.push(parteAtual.trim());
        parteAtual = "";
      }
      parteAtual += bloco;
    });

    if (parteAtual.trim().length > 0) {
      partes.push(parteAtual.trim());
    }

    var totalPartes = partes.length;

    return partes.map(function (conteudo, idx) {
      var numParte = idx + 1;
      var indicacaoParte = totalPartes > 1 ? " (PARTE " + numParte + "/" + totalPartes + ")" : "";
      
      return cabecalhoBase + indicacaoParte + "\n\n" + conteudo + "\n" + rodapeBase;
    });
  }

  /* Renderização e eventos */
  function inicializarGerador() {
    var containerBotoes = document.getElementById("container-botoes-copiar");
    var containerPreview = document.getElementById("container-lista-preview");

    if (!containerPreview || !containerBotoes) return;

    var siglaUni = "ufmg";
    var objUni = unis[siglaUni] || { nome: "UFMG" };
    var nomeUni = objUni.nome || "UFMG";

    var gruposValidos = obterGruposEntraveis(siglaUni);
    var blocos = gerarBlocosPorCategoria(gruposValidos, nomeUni);
    var mensagensFinais = fatiarTextoPorTamanho(blocos, nomeUni);

    // Gerar Botões
    containerBotoes.innerHTML = mensagensFinais.map(function (_, index) {
      var num = index + 1;
      return '<button class="card-comissario__btn btn-copiar-parte" data-index="' + index + '" style="padding: 0.7rem 1rem; font-size: 0.9rem;">' +
        '📋 COPIAR PARTE ' + num + ' DE ' + mensagensFinais.length +
        '</button>';
    }).join("");

    // Gerar Preview visual com separadores das partes
    containerPreview.textContent = mensagensFinais.map(function (msg, idx) {
      return "--- PARTE " + (idx + 1) + " DE " + mensagensFinais.length + " (" + msg.length + " caracteres) ---\n\n" + msg;
    }).join("\n\n\n");

    // Eventos de cópia
    Array.prototype.forEach.call(document.querySelectorAll(".btn-copiar-parte"), function (btn) {
      btn.addEventListener("click", function () {
        var idx = Number(btn.getAttribute("data-index"));
        var textoParaCopiar = mensagensFinais[idx];

        navigator.clipboard.writeText(textoParaCopiar).then(function () {
          var textoOriginal = btn.textContent;
          btn.textContent = "✅ PARTE " + (idx + 1) + " COPIADA!";
          btn.style.background = "var(--verde, #2e7d32)";
          setTimeout(function () {
            btn.textContent = textoOriginal;
            btn.style.background = "";
          }, 2500);
        }).catch(function (err) {
          console.error("Erro ao copiar texto: ", err);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", inicializarGerador);
})();