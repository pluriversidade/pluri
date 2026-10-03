/* ═══════════════════════════════════════════════════════════════════════════
   AS FESTAS
   ═══════════════════════════════════════════════════════════════════════════ */

var ESTADOS = {
  MG: { nome: "Minas Gerais" },
  SP: { nome: "São Paulo" }
};

var CIDADES = {
  bh: { nome: "Belo Horizonte", estado: "MG" },
  uberlandia: { nome: "Uberlândia", estado: "MG" },
  campinas: { nome: "Campinas", estado: "SP" }
};

/* AS UNIVERSIDADES ─────────────────────────────────────────────────────────
   Cada universidade agora aponta para a sua respectiva cidade.
   ═══════════════════════════════════════════════════════════════════════════ */

var UNIVERSIDADES = {
  ufmg:    { nome: "UFMG",         cor: "#B24232", cidade: "bh" },
  puc:     { nome: "PUC Minas",    cor: "#3D6E8C", cidade: "bh" },
  faminas: { nome: "Faminas",      cor: "#2E7D53", cidade: "bh" },
  newton:  { nome: "Newton Paiva", cor: "#C08A1E", cidade: "bh" },
  fumec:   { nome: "FUMEC",        cor: "#e0214a", cidade: "bh" },
  una:     { nome: "UNA",          cor: "#6B5B95", cidade: "bh" }
};


/* AS FESTAS ──────────────────────────────────────────────────────────────── */

var FESTAS = [

  {
    data: "2026-10-03",
    hora: "22h",
    uni: "ufmg",
    titulo: "PIP",
    descricao: "Três pistas, open de chopp até meia-noite. Galpão na Av. Antônio Carlos, perto do portão 2.",
    ingresso: "https://exemplo.com/ingresso",
    perfil: "https://instagram.com/exemplo",
    grupo: "https://chat.whatsapp.com/exemplo",
    midia: "img/banner_festa1.jpg"
  },

  {
    data: "2026-10-11",
    hora: "23h",
    uni: "puc",
    titulo: "Baile do Coração",
    descricao: "Sertanejo e funk em dois ambientes, no Coração Eucarístico. Lote promocional até sexta.",
    ingresso: "https://exemplo.com/ingresso",
    perfil: "https://instagram.com/exemplo",
    grupo: "",
    midia: ""
  },

  {
    data: "2026-10-24",
    hora: "21h30",
    uni: "faminas",
    titulo: "Arraiá Fora de Época",
    descricao: "Quadrilha, quentão e forró pé de serra. Traje caipira opcional, mas bem-vindo.",
    ingresso: "",
    perfil: "https://instagram.com/exemplo",
    grupo: "https://chat.whatsapp.com/exemplo",
    midia: ""
  },

  {
    data: "2026-11-07",
    hora: "22h",
    uni: "newton",
    titulo: "Virada Newton",
    descricao: "Line-up de DJs da casa até as cinco da manhã. Meia-entrada com carteirinha na portaria.",
    ingresso: "https://exemplo.com/ingresso",
    perfil: "",
    grupo: "https://chat.whatsapp.com/exemplo",
    midia: ""
  },

  {
    data: "2026-11-21",
    hora: "",
    uni: "ufmg",
    titulo: "Festa de Encerramento do Semestre",
    descricao: "Organizada pelos centros acadêmicos. Horário e local confirmados na semana da festa.",
    ingresso: "",
    perfil: "https://instagram.com/exemplo",
    grupo: "https://chat.whatsapp.com/exemplo",
    midia: ""
  }

];