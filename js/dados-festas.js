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
   data       o dia da festa, no formato ano-mês-dia: "2026-10-17"
              (sempre quatro números, traço, dois, traço, dois)
   hora       opcional. "22h", "23h30", ou deixe "" para não mostrar
   uni        a universidade, escolhida da lista logo abaixo
   titulo     o nome da festa
   descricao  uma ou duas frases. É um bom lugar para dizer o local
   ingresso   link de venda do ingresso. Deixe "" se ainda não tiver
   perfil     link do Instagram da festa. Deixe "" se não tiver
   grupo      link do grupo de WhatsApp da festa. Deixe "" se não tiver

   Os três links são opcionais: o botão só aparece quando o link existe.
   ═══════════════════════════════════════════════════════════════════════════ */


/* AS UNIVERSIDADES ─────────────────────────────────────────────────────────
   Cada uma vira um botão de filtro. Para acrescentar uma faculdade, copie
   uma linha e troque. A palavra da esquerda (ufmg, puc…) é o apelido usado
   nas festas lá embaixo, no campo uni — precisa ser igual nos dois lugares,
   sem acento e sem espaço.                                                  */

var UNIVERSIDADES = {
  ufmg:    { nome: "UFMG",         cor: "#B24232" },
  puc:     { nome: "PUC Minas",    cor: "#3D6E8C" },
  faminas: { nome: "Faminas",      cor: "#2E7D53" },
  newton:  { nome: "Newton Paiva", cor: "#C08A1E" },
  newton:  { nome: "FUMEC", cor: "#e0214a" },
  una:     { nome: "UNA",          cor: "#6B5B95" }
};


/* AS FESTAS ────────────────────────────────────────────────────────────────

   ATENÇÃO: as festas abaixo são só exemplos, para você ver o formato
   funcionando. Apague todas e coloque as de verdade.                        
   
     {
    data: "",
    hora: "",
    uni: "",
    titulo: "",
    descricao: "",
    ingresso: "",
    perfil: "",
    grupo: ""
  },
  
  */

var FESTAS = [

  {
    data: "2026-10-03",
    hora: "22h",
    uni: "ufmg",
    titulo: "PIP",
    descricao: "Três pistas, open de chopp até meia-noite. Galpão na Av. Antônio Carlos, perto do portão 2.",
    ingresso: "https://exemplo.com/ingresso",
    perfil: "https://instagram.com/exemplo",
    grupo: "https://chat.whatsapp.com/exemplo"
  },

  {
    data: "2026-10-11",
    hora: "23h",
    uni: "puc",
    titulo: "Baile do Coração",
    descricao: "Sertanejo e funk em dois ambientes, no Coração Eucarístico. Lote promocional até sexta.",
    ingresso: "https://exemplo.com/ingresso",
    perfil: "https://instagram.com/exemplo",
    grupo: ""
  },

  {
    data: "2026-10-24",
    hora: "21h30",
    uni: "faminas",
    titulo: "Arraiá Fora de Época",
    descricao: "Quadrilha, quentão e forró pé de serra. Traje caipira opcional, mas bem-vindo.",
    ingresso: "",
    perfil: "https://instagram.com/exemplo",
    grupo: "https://chat.whatsapp.com/exemplo"
  },

  {
    data: "2026-11-07",
    hora: "22h",
    uni: "newton",
    titulo: "Virada Newton",
    descricao: "Line-up de DJs da casa até as cinco da manhã. Meia-entrada com carteirinha na portaria.",
    ingresso: "https://exemplo.com/ingresso",
    perfil: "",
    grupo: "https://chat.whatsapp.com/exemplo"
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
    midia: "banner_festa1.jpg" // ou "teaser.mp4"
  }

];
