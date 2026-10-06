/* ═══════════════════════════════════════════════════════════════════════════
   AS FESTAS
   ═══════════════════════════════════════════════════════════════════════════

   COMO ADICIONAR UMA FESTA
   Copie um bloco inteiro, da chave { até a vírgula depois do }, cole embaixo
   e troque as informações. Não precisa se preocupar com a ordem: a página
   coloca sempre a festa mais próxima em primeiro lugar.

   FESTA QUE JÁ ACONTECEU SOME SOZINHA
   Passou a data, ela deixa de aparecer na página. Não precisa apagar nada —
   mas se quiser limpar o arquivo de vez em quando, fique à vontade.

   O QUE VAI EM CADA CAMPO
   id         identificador único da festa (usado no link direto/compartilhamento, ex: "pip-ufmg")
   data       o dia da festa, no formato ano-mês-dia: "2026-10-17"
              (sempre quatro números, traço, dois, traço, dois)
   hora       opcional. "22h", "23h30", ou deixe "" para não mostrar
   uni        a universidade, escolhida da lista logo abaixo
   titulo     o nome da festa
   descricao  uma ou duas frases. É um bom lugar para dizer o local
   ingresso   link de venda do ingresso. Deixe "" se ainda não tiver
   perfil     link do Instagram da festa. Deixe "" se não tiver
   grupo      link do grupo de WhatsApp da festa. Deixe "" se não tiver
   midia      caminho da imagem ou vídeo do flyer (ex: "img/flyer.jpg" ou "img/teaser.mp4"). Deixe "" se não tiver.

   Os links e a mídia são opcionais: os botões/miniatura só aparecem quando preenchidos.
   ═══════════════════════════════════════════════════════════════════════════ */

   
/* AS UNIVERSIDADES ─────────────────────────────────────────────────────────
   Cada uma vira um botão de filtro. Para acrescentar uma faculdade, copie
   uma linha e troque. A palavra da esquerda (ufmg, puc…) é o apelido usado
   nas festas lá embaixo, no campo uni — precisa ser igual nos dois lugares,
   sem acento e sem espaço.                                                  */

var UNIVERSIDADES = {
  ufmg:    { nome: "UFMG",         cor: "#B24232", cidade: "bh" },
  puc:     { nome: "PUC Minas",    cor: "#3D6E8C", cidade: "bh" },
  faminas: { nome: "Faminas",      cor: "#2E7D53", cidade: "bh" },
  newton:  { nome: "Newton Paiva", cor: "#C08A1E", cidade: "bh" },
  fumec:   { nome: "FUMEC",        cor: "#e0214a", cidade: "bh" },
  una:     { nome: "UNA",          cor: "#6B5B95", cidade: "bh" }
};


/* AS FESTAS ────────────────────────────────────────────────────────────────

   ATENÇÃO: as festas abaixo são só exemplos, para você ver o formato
   funcionando. Apague todas e coloque as de verdade.                        
   
     {
    id: "",
    data: "",
    hora: "",
    uni: "",
    titulo: "",
    descricao: "",
    ingresso: "",
    perfil: "",
    grupo: "",
    midia: ""
  },
  
  */

var ESTADOS = {
  MG: { nome: "Minas Gerais" },
  SP: { nome: "São Paulo" }
};

var CIDADES = {
  bh: { nome: "Belo Horizonte", estado: "MG" },
  uberlandia: { nome: "Uberlândia", estado: "MG" },
  campinas: { nome: "Campinas", estado: "SP" }
};

var FESTAS = [

  {
    id: "pip-ufmg",
    data: "2026-10-03",
    hora: "22h",
    uni: "ufmg",
    titulo: "PIP",
    descricao: "Três pistas, open de chopp até meia-noite. Galpão na Av. Antônio Carlos, perto do portão 2.",
    ingresso: "https://exemplo.com/ingresso",
    perfil: "https://instagram.com/exemplo",
    grupo: "https://chat.whatsapp.com/exemplo",
    midia: "img/banner_festa1.jpg",
    comissarios: true
  },

  {
    id: "baile-do-coracao",
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
    id: "arraiá-fora-de-epoca",
    data: "2026-10-24",
    hora: "21h30",
    uni: "faminas",
    titulo: "Arraiá Fora de Época",
    descricao: "Quadrilha, quentão e forró pé de serra. Traje caipira opcional, mas bem-vindo.",
    ingresso: "",
    perfil: "https://instagram.com/exemplo",
    grupo: "https://chat.whatsapp.com/exemplo",
    midia: "",
    comissarios: true
  },

  {
    id: "virada-newton",
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
    id: "festa-encerramento-semestre",
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