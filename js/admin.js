(function () {
  "use strict";

  function inicializarAdmin() {
    var formLogin = document.getElementById("form-login-admin");
    var boxLogin  = document.getElementById("admin-login-box");
    var boxPainel = document.getElementById("admin-painel-box");
    var msgErro   = document.getElementById("login-erro");
    var btnLogout = document.getElementById("btn-admin-logout");

    // Verificar sessão ativa
    if (sessionStorage.getItem("admin_logado") === "true") {
      if (boxLogin) boxLogin.hidden = true;
      if (boxPainel) boxPainel.hidden = false;
      renderizarAdmin();
    }

    // Login
    if (formLogin) {
      formLogin.addEventListener("submit", function (e) {
        e.preventDefault();
        var u = document.getElementById("login-usuario").value;
        var p = document.getElementById("login-senha").value;

        if (u === "lucastroy" && p === "#Maconha420") {
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

    // Logout
    if (btnLogout) {
      btnLogout.addEventListener("click", function () {
        sessionStorage.removeItem("admin_logado");
        boxLogin.hidden = false;
        boxPainel.hidden = true;
      });
    }

    // Alternar Sub-abas
    var subabas = ["grupos", "festas", "exportar"];
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

    // Popular Categorias
    var selCatAdm = document.getElementById("adm-g-cat");
    if (selCatAdm && window.CATEGORIAS) {
      selCatAdm.innerHTML = Object.keys(window.CATEGORIAS).map(function (k) {
        return '<option value="' + k + '">' + window.CATEGORIAS[k].nome + '</option>';
      }).join("");
    }

    // Popular Universidades
    var selUniAdm = document.getElementById("adm-f-uni");
    if (selUniAdm && window.UNIVERSIDADES) {
      selUniAdm.innerHTML = Object.keys(window.UNIVERSIDADES).map(function (k) {
        return '<option value="' + k + '">' + window.UNIVERSIDADES[k].nome + '</option>';
      }).join("");
    }

    // Guardar/Adicionar Grupo
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
          lotado: document.getElementById("adm-g-lotado").checked
        };

        if (idx >= 0) {
          window.GRUPOS[idx] = gData;
        } else {
          window.GRUPOS.unshift(gData);
        }

        formGrupo.reset();
        document.getElementById("admin-grupo-index").value = "-1";
        renderizarAdmin();
        alert("Alteração salva em memória!");
      });
    }
  }

  function renderizarAdmin() {
    var tbGrupos = document.getElementById("tb-admin-grupos");
    if (tbGrupos && window.GRUPOS) {
      tbGrupos.innerHTML = window.GRUPOS.map(function (g, i) {
        return (
          '<tr>' +
            '<td><strong>' + (g.nome || "") + '</strong></td>' +
            '<td>' + (g.uni || "") + '</td>' +
            '<td>' + (g.membros || 0) + '</td>' +
            '<td>' + (g.lotado ? '🔴 Lotado' : '🟢 Ok') + '</td>' +
            '<td>' +
              '<button class="btn-acao btn-sm btn-acao--secondary btn-toggle-lotado" data-idx="' + i + '">' + (g.lotado ? 'Desmarcar' : 'Marcar Lotado') + '</button> ' +
              '<button class="btn-acao btn-sm btn-acao--danger btn-del-g" data-idx="' + i + '">Excluir</button>' +
            '</td>' +
          '</tr>'
        );
      }).join("");

      document.querySelectorAll(".btn-toggle-lotado").forEach(function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          window.GRUPOS[idx].lotado = !window.GRUPOS[idx].lotado;
          renderizarAdmin();
        });
      });

      document.querySelectorAll(".btn-del-g").forEach(function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          if (confirm("Excluir este grupo?")) {
            window.GRUPOS.splice(idx, 1);
            renderizarAdmin();
          }
        });
      });
    }
  }

  function gerarCodigosExportacao() {
    var areaGrupos = document.getElementById("codigo-grupos-js");
    var areaFestas = document.getElementById("codigo-festas-js");

    if (areaGrupos) {
      areaGrupos.value = "var CATEGORIAS = " + JSON.stringify(window.CATEGORIAS || {}, null, 2) + ";\n\n" +
        "var GRUPOS = " + JSON.stringify(window.GRUPOS || [], null, 2) + ";";
    }

    if (areaFestas) {
      areaFestas.value = "var UNIVERSIDADES = " + JSON.stringify(window.UNIVERSIDADES || {}, null, 2) + ";\n\n" +
        "var FESTAS = " + JSON.stringify(window.FESTAS || [], null, 2) + ";";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarAdmin);
  } else {
    inicializarAdmin();
  }
})();