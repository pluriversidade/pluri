var ESTADOS = {
  "MG": {
    "nome": "Minas Gerais"
  },
  "SP": {
    "nome": "São Paulo"
  }
};

var CIDADES = {
  "bh": {
    "nome": "Belo Horizonte",
    "estado": "MG"
  },
  "uberlandia": {
    "nome": "Uberlândia",
    "estado": "MG"
  },
  "campinas": {
    "nome": "Campinas",
    "estado": "SP"
  }
};

var UNIVERSIDADES = {
  "ufmg": {
    "nome": "UFMG",
    "cor": "#B24232",
    "cidade": "bh",
    "estado": "MG"
  },
  "puc": {
    "nome": "PUC Minas",
    "cor": "#3D6E8C",
    "cidade": "bh",
    "estado": "MG"
  },
  "faminas": {
    "nome": "Faminas",
    "cor": "#2E7D53",
    "cidade": "bh",
    "estado": "MG"
  },
  "newton": {
    "nome": "Newton Paiva",
    "cor": "#C08A1E",
    "cidade": "bh",
    "estado": "MG"
  },
  "fumec": {
    "nome": "FUMEC",
    "cor": "#e0214a",
    "cidade": "bh",
    "estado": "MG"
  },
  "una": {
    "nome": "UNA",
    "cor": "#6B5B95",
    "cidade": "bh",
    "estado": "MG"
  }
};

var FESTAS = [
  {
    "id": "festa-1791258050912",
    "titulo": "NaTora - Edição Submundo",
    "data": "2026-10-08",
    "hora": "22h até 05h",
    "uni": "ufmg",
    "estado": "MG",
    "cidade": "Belo Horizonte",
    "ingresso": "",
    "perfil": "@natoraufmg",
    "grupo": "https://chat.whatsapp.com/Bp9ZBySZg96Jd4OLI9AU5H",
    "midia": "img/sandrinho-comissario-01.mp4",
    "descricao": "Para a felicidade de todos, uma nova versão do natora vai acontecer, é a edição do NATORA - SUBMUNDO ® . Salva aí na sua agenda, mas lembre-se, é quinta feira agora! não tem erro!! no mesmo local de sempre e dessa vez com mais organização. Esperamos você, entrada gratuita, espalhem a notícia.",
    "comissarios": false
  },
  {
    "id": "pip-ufmg",
    "data": "2026-10-03",
    "hora": "22h",
    "uni": "ufmg",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "titulo": "PIP",
    "descricao": "Três pistas, open de chopp até meia-noite. Galpão na Av. Antônio Carlos, perto do portão 2.",
    "ingresso": "https://exemplo.com/ingresso",
    "perfil": "https://instagram.com/exemplo",
    "grupo": "https://chat.whatsapp.com/exemplo",
    "midia": "img/banner_festa1.jpg",
    "comissarios": true
  },
  {
    "id": "baile-do-coracao",
    "data": "2026-10-11",
    "hora": "23h",
    "uni": "puc",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "titulo": "Baile do Coração",
    "descricao": "Sertanejo e funk em dois ambientes, no Coração Eucarístico. Lote promocional até sexta.",
    "ingresso": "https://exemplo.com/ingresso",
    "perfil": "https://instagram.com/exemplo",
    "grupo": "",
    "midia": "",
    "comissarios": false
  },
  {
    "id": "arraiá-fora-de-epoca",
    "data": "2026-10-24",
    "hora": "21h30",
    "uni": "faminas",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "titulo": "Arraiá Fora de Época",
    "descricao": "Quadrilha, quentão e forró pé de serra. Traje caipira opcional, mas bem-vindo.",
    "ingresso": "",
    "perfil": "https://instagram.com/exemplo",
    "grupo": "https://chat.whatsapp.com/exemplo",
    "midia": "",
    "comissarios": true
  },
  {
    "id": "virada-newton",
    "data": "2026-11-07",
    "hora": "22h",
    "uni": "newton",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "titulo": "Virada Newton",
    "descricao": "Line-up de DJs da casa até as cinco da manhã. Meia-entrada com carteirinha na portaria.",
    "ingresso": "https://exemplo.com/ingresso",
    "perfil": "",
    "grupo": "https://chat.whatsapp.com/exemplo",
    "midia": "",
    "comissarios": false
  },
  {
    "id": "festa-encerramento-semestre",
    "data": "2026-11-21",
    "hora": "",
    "uni": "ufmg",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "titulo": "Festa de Encerramento do Semestre",
    "descricao": "Organizada pelos centros acadêmicos. Horário e local confirmados na semana da festa.",
    "ingresso": "",
    "perfil": "https://instagram.com/exemplo",
    "grupo": "https://chat.whatsapp.com/exemplo",
    "midia": "",
    "comissarios": true
  }
];