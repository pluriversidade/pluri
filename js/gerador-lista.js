/* ═══════════════════════════════════════════════════════════════════════════
   GERADOR DA LISTA COMPLETA DA UFMG (PLURIVERSIDADE)
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var grupos = window.GRUPOS || [];
  var categorias = window.CATEGORIAS || {};

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

  // Filtrar apenas grupos da UFMG que não estão lotados
  var gruposUFMG = grupos.filter(function (g) {
    var ehUFMG = g && g.uni && String(g.uni).toLowerCase() === "ufmg";
    var naoLotado = !g.lotado;
    return ehUFMG && naoLotado && g.nome && pareceLink(g.url);
  });

  // Agrupar por categoria
  var porCategoria = {};
  gruposUFMG.forEach(function (g) {
    var catKey = g.cat || "outros";
    if (!porCategoria[catKey]) {
      porCategoria[catKey] = [];
    }
    porCategoria[catKey].push(g);
  });

  function gerarTextoWhatsApp() {
    var linhas = [];
    linhas.push("*LISTA COMPLETA COM OS LINKS DOS GRUPOS DA UFMG*");
    linhas.push("");

    Object.keys(porCategoria).forEach(function (catKey) {
      var catObj = categorias[catKey] || { nome: catKey.toUpperCase() };
      var listaCat = porCategoria[catKey];
      var count = listaCat.length;

      linhas.push("════════════════════════");
      linhas.push("*" + catObj.nome.toUpperCase() + "* - [" + count + " grupo" + (count > 1 ? "s" : "") + "]");
      linhas.push("_(Grupos não listados nesta categoria estão lotados)_");
      linhas.push("");

      listaCat.forEach(function (g) {
        var slug = slugify(g.nome);
        var urlCard = "https://pluriversidade.com.br/#grupos/" + slug;
        var qtdMembros = g.membros ? g.membros + " membros" : "Grupo aberto";

        linhas.push("• *" + g.nome + "* - [" + qtdMembros + "]");
        linhas.push(urlCard);
        linhas.push("");
      });
    });

    linhas.push("════════════════════════");
    linhas.push("*Compartilhe essa lista em todos os grupos da UFMG*");

    return linhas.join("\n");
  }

  function renderizarPreviewVisual() {
    var container = document.getElementById("container-lista-preview");
    if (!container) return;

    var html = [];
    html.push('<div style="text-align: center; margin-bottom: 1.5rem;">');
    html.push('<h2 style="margin: 0; font-size: 1.3rem; color: var(--terracota);">*LISTA COMPLETA COM OS LINKS DOS GRUPOS DA UFMG*</h2>');
    html.push('<p style="font-size: 0.85rem; color: var(--tinta-fraca); margin-top: 0.3rem;">Total de grupos ativos: <strong>' + gruposUFMG.length + '</strong></p>');
    html.push('</div>');

    Object.keys(porCategoria).forEach(function (catKey) {
      var catObj = categorias[catKey] || { nome: catKey };
      var listaCat = porCategoria[catKey];
      var corCat = catObj.cor || "var(--verde)";

      html.push('<div style="border-left: 4px solid ' + corCat + '; padding-left: 0.8rem; margin-top: 1.8rem; margin-bottom: 0.8rem;">');
      html.push('<h3 style="margin: 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.03em;">' + catObj.nome + ' <span style="font-size: 0.85rem; font-weight: normal; color: var(--tinta-fraca);">— [' + listaCat.length + ' grupos]</span></h3>');
      html.push('<p style="margin: 0.1rem 0 0; font-size: 0.78rem; color: var(--tinta-fraca); font-style: italic;">Grupos não listados nesta categoria estão lotados.</p>');
      html.push('</div>');

      html.push('<div style="display: grid; gap: 0.6rem; margin-bottom: 1.2rem;">');
      listaCat.forEach(function (g) {
        var slug = slugify(g.nome);
        var urlCard = "https://pluriversidade.com.br/#grupos/" + slug;
        var qtdMembros = g.membros ? g.membros + " membros" : "Membros não informados";

        html.push('<div style="background: var(--fundo); border: 1px solid var(--regua); border-radius: 8px; padding: 0.6rem 0.8rem;">');
        html.push('<div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">');
        html.push('<strong style="font-size: 0.95rem;">' + g.nome + '</strong>');
        html.push('<span style="font-size: 0.75rem; background: rgba(0,0,0,0.06); padding: 0.15rem 0.4rem; border-radius: 4px; font-family: var(--mono);">' + qtdMembros + '</span>');
        html.push('</div>');
        html.push('<a href="' + urlCard + '" target="_blank" style="font-size: 0.8rem; color: var(--verde); word-break: break-all; margin-top: 0.3rem; display: block;">' + urlCard + '</a>');
        html.push('</div>');
      });
      html.push('</div>');
    });

    html.push('<div style="text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed var(--regua);">');
    html.push('<p style="font-weight: bold; color: var(--terracota); font-size: 1rem;">*Compartilhe essa lista em todos os grupos da UFMG*</p>');
    html.push('</div>');

    container.innerHTML = html.join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderizarPreviewVisual();

    var btnCopiar = document.getElementById("btn-copiar-lista");
    if (btnCopiar) {
      btnCopiar.addEventListener("click", function () {
        var textoFormatado = gerarTextoWhatsApp();
        navigator.clipboard.writeText(textoFormatado).then(function () {
          var textoOriginal = btnCopiar.textContent;
          btnCopiar.textContent = "✅ LISTA COPIADA!";
          setTimeout(function () {
            btnCopiar.textContent = textoOriginal;
          }, 2500);
        }).catch(function (err) {
          alert("Erro ao copiar lista: " + err);
        });
      });
    }
  });
})();