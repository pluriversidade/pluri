/* ═══════════════════════════════════════════════════════════════════════════
   OS PARCEIROS DO CARROSSEL
   ═══════════════════════════════════════════════════════════════════════════

   Os anúncios do topo da página passam sozinhos, um a cada seis segundos, e
   também deslizam com o dedo. Quanto mais parceiros, mais tempo cada um leva
   para voltar a aparecer — de dois a quatro costuma ser o ponto certo.

   COMO ADICIONAR UM PARCEIRO
   Copie um bloco inteiro, da chave { até a vírgula depois do }, cole embaixo
   e troque as informações.

   O QUE VAI EM CADA CAMPO
   selo      a linha pequena de cima. "Esta lista é oferecida por", "Apoio"…
   nome      o nome do parceiro, em letras grandes
   chamada   uma ou duas frases sobre o que ele faz
   botao     o texto do botão
   link      para onde o botão leva
   logo      caminho da imagem, como "img/parceiro-ceder.png".
             Deixe "" para não mostrar imagem nenhuma

   PARA TROCAR O LOGO DE UM PARCEIRO
   Coloque o arquivo de imagem dentro da pasta img/ e escreva o nome dele no
   campo logo. Imagem quadrada fica melhor.
   ═══════════════════════════════════════════════════════════════════════════ */

var PARCEIROS = [

  {
    selo: "NOSS@S PARCEIR@S",
    nome: "CEDER | Divisão de Despesas",
    chamada: "A calculadora mais completa do Brasil (e do mundo) para dividir contas e tarefas de repúblicas. Já atendemos +20 moradias compartilhadas!",
    botao: "Feche GRÁTIS as faturas do mês",

    link: "https://instagram.com/ceder.jdj",

    logo: "img/parceiro-ceder.png"
  },

  {
    selo: "Espaço para parceria",
    nome: "ROLÊS UNIVERSITÁIROS",
    chamada: "O seu guia definitivo e a forma mais rápida de saber das melhores festas universitárias que vão rolar em BH e região metropolitana. Cobertura completa, energia alta e o verdadeiro espírito acadêmico reunido em um só lugar. Se liga no que tá rolando e não perca nenhum rolê!.",
    botao: "Acesse AGORA nosso perfil do instagram",
    link: "https://www.instagram.com/rolesuniversitariosoficial/",
    logo: "img/logo-roles-1.png"
  },

  {
    selo: "Espaço para parceria",
    nome: "Sua marca aqui",
    chamada: "Este espaço aparece para quem procura grupo da UFMG todos os dias. Fale com a gente para anunciar.",
    botao: "Quero anunciar",
    link: "https://wa.me/5531991579687?text=Oi%2C%20quero%20anunciar%20na%20p%C3%A1gina%20dos%20grupos%20da%20UFMG",
    logo: ""
  }

];
