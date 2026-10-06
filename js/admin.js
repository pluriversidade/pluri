(function () {
  "use strict";

  // Garantir estruturas globais
  if (!window.ESTADOS) window.ESTADOS = {};
  if (!window.CIDADES) window.CIDADES = {};
  if (!window.UNIVERSIDADES) window.UNIVERSIDADES = {};
  if (!window.CATEGORIAS) window.CATEGORIAS = {};
  if (!window.GRUPOS) window.GRUPOS = [];
  if (!window.FESTAS) window.FESTAS = [];

  function slugify(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function inicializarAdmin() {
    var formLogin = document.getElementById("form-login-admin");
    var boxLogin  = document.getElementById("admin-login-box");
    var boxPainel = document.getElementById("admin-painel-box");
    var msgErro   = document.getElementById("login-erro");
    var btnLogout = document.getElementById("btn-admin-logout");

    if (sessionStorage.getItem("admin_logado") === "true") {
      if (boxLogin) boxLogin.hidden = true;
      if (boxPainel) boxPainel.hidden = false;
      atualizarSelects();
      renderizarTabelas();
    }

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
          atualizarSelects();
          renderizarTabelas();
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

    // Sub-abas
    var subabas = ["grupos", "universidades", "festas", "exportar"];
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

    // --- MANIPULAÇÃO DE GRUPOS ---
    var formGrupo = document.getElementById("form-admin-grupo");
    if (formGrupo) {
      formGrupo.addEventListener("submit", function (e) {
        e.preventDefault();
        var idx = Number(document.getElementById("admin-grupo-index").value);

        var gData = {
          nome: document.getElementById("adm-g-nome").value,
          uni: document.getElementById("adm-g-uni").value,
          estado: document.getElementById("adm-g-estado").value,
          cidade: document.getElementById("adm-g-cidade").value,
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

        resetarFormGrupo();
        renderizarTabelas();
        alert("Grupo salvo com sucesso na memória!");
      });

      document.getElementById("btn-cancelar-grupo").addEventListener("click", resetarFormGrupo);
    }

    // --- MANIPULAÇÃO DE UNIVERSIDADES ---
    var formUni = document.getElementById("form-admin-uni");
    if (formUni) {
      formUni.addEventListener("submit", function (e) {
        e.preventDefault();
        var chaveAntiga = document.getElementById("admin-uni-key").value;
        var nomeUni = document.getElementById("adm-u-nome").value.trim();

        var uData = {
          nome: nomeUni,
          estado: document.getElementById("adm-u-estado").value,
          cidade: document.getElementById("adm-u-cidade").value,
          site: document.getElementById("adm-u-site").value,
          logo: document.getElementById("adm-u-logo").value,
          endereco: document.getElementById("adm-u-endereco").value,
          tel1: document.getElementById("adm-u-tel1").value,
          tel2: document.getElementById("adm-u-tel2").value
        };

        if (chaveAntiga && chaveAntiga !== nomeUni) {
          delete window.UNIVERSIDADES[chaveAntiga];
        }

        window.UNIVERSIDADES[nomeUni] = uData;

        resetarFormUni();
        atualizarSelects();
        renderizarTabelas();
        alert("Universidade salva com sucesso!");
      });

      document.getElementById("btn-cancelar-uni").addEventListener("click", resetarFormUni);
    }

    // --- MANIPULAÇÃO DE FESTAS ---
    var formFesta = document.getElementById("form-admin-festa");
    if (formFesta) {
      formFesta.addEventListener("submit", function (e) {
        e.preventDefault();
        var idx = Number(document.getElementById("admin-festa-index").value);

        var fData = {
          id: idx >= 0 && window.FESTAS[idx].id ? window.FESTAS[idx].id : "festa-" + Date.now(),
          titulo: document.getElementById("adm-f-titulo").value,
          data: document.getElementById("adm-f-data").value,
          hora: document.getElementById("adm-f-hora").value,
          uni: document.getElementById("adm-f-uni").value,
          estado: document.getElementById("adm-f-estado").value,
          cidade: document.getElementById("adm-f-cidade").value,
          ingresso: document.getElementById("adm-f-ingresso").value,
          perfil: document.getElementById("adm-f-perfil").value,
          grupo: document.getElementById("adm-f-grupo").value,
          midia: document.getElementById("adm-f-midia").value,
          descricao: document.getElementById("adm-f-desc").value,
          comissarios: document.getElementById("adm-f-comissarios").checked
        };

        if (idx >= 0) {
          window.FESTAS[idx] = fData;
        } else {
          window.FESTAS.unshift(fData);
        }

        resetarFormFesta();
        renderizarTabelas();
        alert("Festa salva com sucesso!");
      });

      document.getElementById("btn-cancelar-festa").addEventListener("click", resetarFormFesta);
    }
  }

  function atualizarSelects() {
    var selCatAdm = document.getElementById("adm-g-cat");
    if (selCatAdm && window.CATEGORIAS) {
      selCatAdm.innerHTML = Object.keys(window.CATEGORIAS).map(function (k) {
        return '<option value="' + k + '">' + window.CATEGORIAS[k].nome + '</option>';
      }).join("");
    }

    var selUniAdmGroup = document.getElementById("adm-g-uni");
    var selUniAdmFesta = document.getElementById("adm-f-uni");
    var optionsUni = Object.keys(window.UNIVERSIDADES || {}).map(function (k) {
      return '<option value="' + k + '">' + (window.UNIVERSIDADES[k].nome || k) + '</option>';
    }).join("");

    if (selUniAdmGroup) selUniAdmGroup.innerHTML = optionsUni;
    if (selUniAdmFesta) selUniAdmFesta.innerHTML = optionsUni;
  }

  function resetarFormGrupo() {
    document.getElementById("form-admin-grupo").reset();
    document.getElementById("admin-grupo-index").value = "-1";
    document.getElementById("titulo-form-grupo").textContent = "Adicionar Novo Grupo";
    document.getElementById("btn-salvar-grupo").textContent = "Salvar Grupo";
    document.getElementById("btn-cancelar-grupo").hidden = true;
  }

  function resetarFormUni() {
    document.getElementById("form-admin-uni").reset();
    document.getElementById("admin-uni-key").value = "";
    document.getElementById("titulo-form-uni").textContent = "Adicionar Nova Universidade";
    document.getElementById("btn-salvar-uni").textContent = "Salvar Universidade";
    document.getElementById("btn-cancelar-uni").hidden = true;
  }

  function resetarFormFesta() {
    document.getElementById("form-admin-festa").reset();
    document.getElementById("admin-festa-index").value = "-1";
    document.getElementById("titulo-form-festa").textContent = "Adicionar Nova Festa";
    document.getElementById("btn-salvar-festa").textContent = "Salvar Festa";
    document.getElementById("btn-cancelar-festa").hidden = true;
  }

  function renderizarTabelas() {
    // --- TABELA GRUPOS ---
    var tbGrupos = document.getElementById("tb-admin-grupos");
    if (tbGrupos && window.GRUPOS) {
      tbGrupos.innerHTML = window.GRUPOS.map(function (g, i) {
        var uniData = window.UNIVERSIDADES[g.uni] || {};
        var cid = g.cidade || uniData.cidade || "";
        var est = g.estado || uniData.estado || "";
        var localStr = cid + (est ? " - " + est : "");
        var slugGrupo = slugify(g.nome);
        var linkCard = "index.html#grupos/grupo-" + slugGrupo;

        return (
          '<tr>' +
            '<td><a href="' + linkCard + '" target="_blank" style="color:#6366f1; font-weight:bold; text-decoration:none;">' + (g.nome || "Sem Nome") + ' 🔗</a><br><small style="color:#94a3b8;">' + (g.desc || "Sem descrição") + '</small></td>' +
            '<td><strong>' + (g.uni || "") + '</strong>' + (localStr ? '<br><small style="color:#94a3b8;">' + localStr + '</small>' : '') + '</td>' +
            '<td>' + (g.cat || "") + '</td>' +
            '<td>' + (g.membros || 0) + '</td>' +
            '<td>' + (g.url ? '<a href="' + g.url + '" target="_blank" style="color:#10b981;">WhatsApp</a>' : '-') + '</td>' +
            '<td>' + (g.lotado ? '🔴 Lotado' : '🟢 OK') + '</td>' +
            '<td>' +
              '<button class="btn-acao btn-sm btn-acao--secondary btn-edit-g" data-idx="' + i + '">Editar</button> ' +
              '<button class="btn-acao btn-sm btn-acao--danger btn-del-g" data-idx="' + i + '">Excluir</button>' +
            '</td>' +
          '</tr>'
        );
      }).join("");

      document.querySelectorAll(".btn-edit-g").forEach(function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          var g = window.GRUPOS[idx];
          
          document.getElementById("admin-grupo-index").value = idx;
          document.getElementById("adm-g-nome").value = g.nome || "";
          document.getElementById("adm-g-uni").value = g.uni || "";
          document.getElementById("adm-g-estado").value = g.estado || "";
          document.getElementById("adm-g-cidade").value = g.cidade || "";
          document.getElementById("adm-g-cat").value = g.cat || "";
          document.getElementById("adm-g-url").value = g.url || "";
          document.getElementById("adm-g-membros").value = g.membros || 0;
          document.getElementById("adm-g-desc").value = g.desc || "";
          document.getElementById("adm-g-lotado").checked = !!g.lotado;

          document.getElementById("titulo-form-grupo").textContent = "Editar Grupo: " + g.nome;
          document.getElementById("btn-salvar-grupo").textContent = "Atualizar Grupo";
          document.getElementById("btn-cancelar-grupo").hidden = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

      document.querySelectorAll(".btn-del-g").forEach(function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          var nomeGrupo = window.GRUPOS[idx] ? window.GRUPOS[idx].nome : "este grupo";
          
          if (confirm("Tem certeza de que deseja excluir o grupo '" + nomeGrupo + "'? Esta ação não pode ser desfeita.")) {
            window.GRUPOS.splice(idx, 1);
            renderizarTabelas();
          }
        });
      });
    }

    // --- TABELA UNIVERSIDADES ---
    var tbUnis = document.getElementById("tb-admin-unis");
    if (tbUnis && window.UNIVERSIDADES) {
      var keys = Object.keys(window.UNIVERSIDADES);
      tbUnis.innerHTML = keys.map(function (k) {
        var u = window.UNIVERSIDADES[k];
        var localStr = (u.cidade || "") + (u.estado ? " - " + u.estado : "");
        return (
          '<tr>' +
            '<td><strong>' + (u.nome || k) + '</strong></td>' +
            '<td>' + (localStr || "-") + '</td>' +
            '<td>' + (u.site ? '<a href="' + u.site + '" target="_blank" style="color:#10b981;">Site</a>' : '-') + '</td>' +
            '<td>' + (u.tel1 || "-") + '</td>' +
            '<td>' + (u.tel2 || "-") + '</td>' +
            '<td>' +
              '<button class="btn-acao btn-sm btn-acao--secondary btn-edit-u" data-key="' + k + '">Editar</button> ' +
              '<button class="btn-acao btn-sm btn-acao--danger btn-del-u" data-key="' + k + '">Excluir</button>' +
            '</td>' +
          '</tr>'
        );
      }).join("");

      document.querySelectorAll(".btn-edit-u").forEach(function (b) {
        b.addEventListener("click", function () {
          var key = b.getAttribute("data-key");
          var u = window.UNIVERSIDADES[key];

          document.getElementById("admin-uni-key").value = key;
          document.getElementById("adm-u-nome").value = u.nome || key;
          document.getElementById("adm-u-estado").value = u.estado || "";
          document.getElementById("adm-u-cidade").value = u.cidade || "";
          document.getElementById("adm-u-site").value = u.site || "";
          document.getElementById("adm-u-logo").value = u.logo || "";
          document.getElementById("adm-u-endereco").value = u.endereco || "";
          document.getElementById("adm-u-tel1").value = u.tel1 || "";
          document.getElementById("adm-u-tel2").value = u.tel2 || "";

          document.getElementById("titulo-form-uni").textContent = "Editar Universidade: " + (u.nome || key);
          document.getElementById("btn-salvar-uni").textContent = "Atualizar Universidade";
          document.getElementById("btn-cancelar-uni").hidden = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

      document.querySelectorAll(".btn-del-u").forEach(function (b) {
        b.addEventListener("click", function () {
          var key = b.getAttribute("data-key");
          if (confirm("Tem certeza de que deseja excluir a universidade '" + key + "'?")) {
            delete window.UNIVERSIDADES[key];
            atualizarSelects();
            renderizarTabelas();
          }
        });
      });
    }

    // --- TABELA FESTAS ---
    var tbFestas = document.getElementById("tb-admin-festas");
    if (tbFestas && window.FESTAS) {
      tbFestas.innerHTML = window.FESTAS.map(function (f, i) {
        var uniData = window.UNIVERSIDADES[f.uni] || {};
        var cid = f.cidade || uniData.cidade || "";
        var est = f.estado || uniData.estado || "";
        var localStr = cid + (est ? " - " + est : "");

        var botoesLinks = [];
        if (f.ingresso) botoesLinks.push('<a href="' + f.ingresso + '" target="_blank" style="color:#10b981;">Ingresso</a>');
        if (f.perfil) botoesLinks.push('<a href="' + f.perfil + '" target="_blank" style="color:#e1306c;">Instagram</a>');
        if (f.grupo) botoesLinks.push('<a href="' + f.grupo + '" target="_blank" style="color:#25d366;">Whats</a>');
        if (f.midia) botoesLinks.push('<a href="' + f.midia + '" target="_blank" style="color:#6366f1;">Mídia</a>');

        return (
          '<tr>' +
            '<td>' + (f.data || "") + (f.hora ? ' às ' + f.hora : '') + '</td>' +
            '<td><strong>' + (f.titulo || "") + '</strong>' + '</td>' +
            '<td><strong>' + (f.uni || "") + '</strong>' + (localStr ? '<br><small style="color:#94a3b8;">' + localStr + '</small>' : '') + '</td>' +
            '<td>' + (botoesLinks.length ? botoesLinks.join(" | ") : "-") + '</td>' +
            '<td>' + (f.comissarios ? '✅ Sim' : '❌ Não') + '</td>' +
            '<td>' +
              '<button class="btn-acao btn-sm btn-acao--secondary btn-edit-f" data-idx="' + i + '">Editar</button> ' +
              '<button class="btn-acao btn-sm btn-acao--danger btn-del-f" data-idx="' + i + '">Excluir</button>' +
            '</td>' +
          '</tr>'
        );
      }).join("");

      document.querySelectorAll(".btn-edit-f").forEach(function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          var f = window.FESTAS[idx];

          document.getElementById("admin-festa-index").value = idx;
          document.getElementById("adm-f-titulo").value = f.titulo || "";
          document.getElementById("adm-f-data").value = f.data || "";
          document.getElementById("adm-f-hora").value = f.hora || "";
          document.getElementById("adm-f-uni").value = f.uni || "";
          document.getElementById("adm-f-estado").value = f.estado || "";
          document.getElementById("adm-f-cidade").value = f.cidade || "";
          document.getElementById("adm-f-ingresso").value = f.ingresso || "";
          document.getElementById("adm-f-perfil").value = f.perfil || "";
          document.getElementById("adm-f-grupo").value = f.grupo || "";
          document.getElementById("adm-f-midia").value = f.midia || "";
          document.getElementById("adm-f-desc").value = f.descricao || "";
          document.getElementById("adm-f-comissarios").checked = !!f.comissarios;

          document.getElementById("titulo-form-festa").textContent = "Editar Festa: " + f.titulo;
          document.getElementById("btn-salvar-festa").textContent = "Atualizar Festa";
          document.getElementById("btn-cancelar-festa").hidden = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

      document.querySelectorAll(".btn-del-f").forEach(function (b) {
        b.addEventListener("click", function () {
          var idx = Number(b.getAttribute("data-idx"));
          var tituloFesta = window.FESTAS[idx] ? window.FESTAS[idx].titulo : "esta festa";

          if (confirm("Tem certeza de que deseja excluir a festa '" + tituloFesta + "'?")) {
            window.FESTAS.splice(idx, 1);
            renderizarTabelas();
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
        "var UNIVERSIDADES = " + JSON.stringify(window.UNIVERSIDADES || {}, null, 2) + ";\n\n" +
        "var GRUPOS = " + JSON.stringify(window.GRUPOS || [], null, 2) + ";";
    }

    if (areaFestas) {
      areaFestas.value = "var ESTADOS = " + JSON.stringify(window.ESTADOS || {}, null, 2) + ";\n\n" +
        "var CIDADES = " + JSON.stringify(window.CIDADES || {}, null, 2) + ";\n\n" +
        "var UNIVERSIDADES = " + JSON.stringify(window.UNIVERSIDADES || {}, null, 2) + ";\n\n" +
        "var FESTAS = " + JSON.stringify(window.FESTAS || [], null, 2) + ";";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarAdmin);
  } else {
    inicializarAdmin();
  }
})();