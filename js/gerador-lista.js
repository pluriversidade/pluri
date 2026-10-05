/* ═══════════════════════════════════════════════════════════════════════════
   GERADOR DE LISTAS DIVIDIDAS PARA WHATSAPP (UFMG / OUTRAS UNIS)
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var LIMITE_WHATSAPP_CHARS = 3800; // Limite seguro de caracteres por mensagem do WhatsApp

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

  function escapar(texto) {
    return String(texto || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Filtra apenas grupos válidos da universidade, ignorando lotados ou com 1024+ membros */
  function obterGruposEntraveis(siglaUni) {
    var uniAlvo = (siglaUni || "ufmg").toLowerCase();
    return grupos.filter(function (g) {
      if (!g || !g.uni || g.uni.toLowerCase() !== uniAlvo) return false;
      if (!pareceLink(g.url)) return false;
      if (g.lotado) return false;

      // Exclui grupos que possuem 1024 membros ou mais
      var qtdMembros = Number(g.membros) || 0;
      if (qtdMembros >= 1024) return false;

      return true;
    });
  }

  /* Gera a estrutura de dados separada por categoria */
  function obterEstruturaCategorias(gruposFiltrados) {
    var porCat = {};

    gruposFiltrados.forEach(function (g) {
      if (!porCat[g.cat]) {
        porCat[g.cat] = [];
      }
      porCat[g.cat].push(g);
    });

    var resultado = [];

    Object.keys(porCat).forEach(function (catKey) {
      var listaCat = porCat[catKey];
      if (listaCat.length === 0) return;

      var catObj = categorias[catKey] || { nome: catKey };

      resultado.push({
        key: catKey,
        nome: catObj.nome,
        cor: catObj.cor || "var(--verde)",
        grupos: listaCat
      });
    });

    return resultado;
  }

  /* Converte um bloco de categoria para o formato de texto com marcações do WhatsApp */
  function converterCategoriaParaTextoWhatsapp(catData) {
    var tituloCat = catData.nome.toUpperCase();

    var textoBloco = "════════════════════════\n" +
      "*" + tituloCat + "* - [" + catData.grupos.length + " " + (catData.grupos.length === 1 ? "grupo" : "grupos") + "]\n" +
      "_(Grupos não listados nesta categoria estão lotados)_\n\n";

    catData.grupos.forEach(function (g) {
      var slugGrupo = slugify(g.nome);
      var urlCard = "https://pluriversidade.github.io/pluri/#grupos/" + slugGrupo;
      var infoMembros = g.membros ? "[" + g.membros + " membros]" : "[Grupo aberto]";

      textoBloco += "• *" + g.nome + "* - " + infoMembros + "\n" + urlCard + "\n\n";
    });

    return textoBloco;
  }

  /* Fatia o conteúdo em partes menores para o WhatsApp */
  function fatiarParaWhatsapp(categoriasEstruturadas, nomeUni) {
    var cabecalhoBase = "*LISTA COMPLETA COM OS LINKS DOS GRUPOS DA " + nomeUni.toUpperCase() + "*";
    var rodapeBase = "════════════════════════\n*Compartilhe essa lista em todos os grupos da " + nomeUni.toUpperCase() + "*";

    // Converte cada categoria para o seu texto WhatsApp e mantém a referência aos dados visuais
    var blocosComDados = categoriasEstruturadas.map(function (cat) {
      return {
        catData: cat,
        textoWa: converterCategoriaParaTextoWhatsapp(cat)
      };
    });

    var partes = [];
    var parteAtualTextos = [];
    var parteAtualCategorias = [];
    var tamanhoAtual = 0;

    blocosComDados.forEach(function (item) {
      var tamanhoBloco = item.textoWa.length;

      if ((tamanhoAtual + tamanhoBloco + rodapeBase.length + 300) > LIMITE_WHATSAPP_CHARS && parteAtualTextos.length > 0) {
        partes.push({
          textos: parteAtualTextos,
          categorias: parteAtualCategorias
        });
        parteAtualTextos = [];
        parteAtualCategorias = [];
        tamanhoAtual = 0;
      }

      parteAtualTextos.push(item.textoWa);
      parteAtualCategorias.push(item.catData);
      tamanhoAtual += tamanhoBloco;
    });

    if (parteAtualTextos.length > 0) {
      partes.push({
        textos: parteAtualTextos,
        categorias: parteAtualCategorias
      });
    }

    var totalPartes = partes.length;

    // Constrói a mensagem final do WhatsApp para cada parte
    return partes.map(function (parte, idx) {
      var numParte = idx + 1;
      var numProximaLista = numParte + 1;
      var indicacaoParte = totalPartes > 1 ? " (PARTE " + numParte + "/" + totalPartes + ")" : "";

      var sufixoProximaLista = "";
      if (numParte < totalPartes) {
        var msgSuporte = "Olá, gostaria de receber a lista " + numProximaLista + " dos grupos que ainda tem vaga da " + nomeUni + ", você pode me enviar aqui por favor?";
        var linkWaProxima = "https://wa.me/5531991579687?text=" + encodeURIComponent(msgSuporte);

        sufixoProximaLista = "\n\nPara pedir a lista " + numProximaLista + ", clique aqui: " + linkWaProxima;
      }

      var textoWaCompleto = cabecalhoBase + indicacaoParte + "\n\n" +
        parte.textos.join("") +
        rodapeBase +
        sufixoProximaLista;

      return {
        numParte: numParte,
        totalPartes: totalPartes,
        textoWa: textoWaCompleto,
        categorias: parte.categorias,
        sufixoProximaLista: sufixoProximaLista
      };
    });
  }

  /* Renderização na página utilizando o CSS padrão do site */
  function inicializarGerador() {
    var containerBotoes = document.getElementById("container-botoes-copiar");
    var containerPreview = document.getElementById("container-lista-preview");

    if (!containerPreview || !containerBotoes) return;

    var siglaUni = "ufmg";
    var objUni = unis[siglaUni] || { nome: "UFMG" };
    var nomeUni = objUni.nome || "UFMG";

    var gruposValidos = obterGruposEntraveis(siglaUni);
    var categoriasEstruturadas = obterEstruturaCategorias(gruposValidos);
    var partesProcessadas = fatiarParaWhatsapp(categoriasEstruturadas, nomeUni);

    // 1. Gerar Botões de Cópia
    containerBotoes.innerHTML = partesProcessadas.map(function (p, index) {
      return '<button class="card-comissario__btn btn-copiar-parte" data-index="' + index + '" style="padding: 0.7rem 1rem; font-size: 0.9rem;">' +
        '📋 COPIAR PARTE ' + p.numParte + ' DE ' + p.totalPartes +
        '</button>';
    }).join("");

    // 2. Renderizar Preview Formatada com o CSS do Site
    containerPreview.innerHTML = partesProcessadas.map(function (parte) {
      var htmlCategorias = parte.categorias.map(function (cat) {
        var htmlGrupos = cat.grupos.map(function (g) {
          var slugGrupo = slugify(g.nome);

          return (
            '<li class="item" style="--cor:' + cat.cor + '; margin-bottom: 0.5rem;">' +
              '<a class="grupo" href="' + g.url + '" target="_blank" rel="noopener">' +
                '<div class="grupo__topo-linha">' +
                  '<span class="grupo__nome">' + escapar(g.nome) + '</span>' +
                '</div>' +
                '<div class="grupo__meta">' +
                  '<span class="ponto"></span>' +
                  '<span>' + escapar(cat.nome) + '</span>' +
                  '<span>• ' + (g.membros ? g.membros + ' membros' : 'Grupo aberto') + '</span>' +
                '</div>' +
              '</a>' +
            '</li>'
          );
        }).join("");

        return (
          '<div style="margin-bottom: 1.5rem;">' +
            '<h3 style="font-size: 1.1rem; color: var(--terracota); margin-bottom: 0.5rem; text-transform: uppercase;">' +
              escapar(cat.nome) + ' (' + cat.grupos.length + ')' +
            '</h3>' +
            '<ul class="lista-limpa">' + htmlGrupos + '</ul>' +
          '</div>'
        );
      }).join("");

      var htmlPedirProxima = parte.sufixoProximaLista ? (
        '<div style="margin-top: 1.5rem; padding: 1rem; background: var(--fundo, #f4f6f8); border-radius: 6px; font-size: 0.95rem; color: var(--tinta);">' +
          '<strong>Link para pedir a próxima lista inserido no WhatsApp:</strong><br>' +
          '<code style="word-break: break-all;">' + escapar(parte.sufixoProximaLista.trim()) + '</code>' +
        '</div>'
      ) : "";

      return (
        '<section class="bloco" style="background: var(--papel); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--linha);">' +
          '<h2 style="font-size: 1.3rem; margin-bottom: 1rem; color: var(--azul); border-bottom: 2px solid var(--linha); padding-bottom: 0.5rem;">' +
            'Parte ' + parte.numParte + ' de ' + parte.totalPartes +
          '</h2>' +
          htmlCategorias +
          htmlPedirProxima +
        '</section>'
      );
    }).join("");

    // 3. Evento nos Botões de Cópia (Copia o texto formatado para o WhatsApp)
    Array.prototype.forEach.call(document.querySelectorAll(".btn-copiar-parte"), function (btn) {
      btn.addEventListener("click", function () {
        var idx = Number(btn.getAttribute("data-index"));
        var textoParaCopiar = partesProcessadas[idx].textoWa;

        navigator.clipboard.writeText(textoParaCopiar).then(function () {
          var textoOriginal = btn.textContent;
          btn.textContent = "✅ PARTE " + (idx + 1) + " COPIADA!";
          btn.style.background = "var(--verde, #2e7d32)";
          setTimeout(function () {
            btn.textContent = textoOriginal;
            btn.style.background = "";
          }, 2500);
        }).catch(function (err) {
          console.error("Erro ao copiar para o WhatsApp: ", err);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", inicializarGerador);
})();