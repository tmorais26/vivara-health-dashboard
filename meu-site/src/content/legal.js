// Política de Privacidade e Termos de Serviço da Vivara.
// RASCUNHO para revisão jurídica. Tudo o que está entre [ ] ainda não está
// decidido (fornecedores, sociedade, prazos) e aparece destacado no site.
//
// Formato de cada secção: { id, h, body: [...] }, em que cada elemento de
// body é um parágrafo (string), { list: [...] } ou { rows: [[rótulo, texto]] }.

const UPDATED_PT = "Última atualização: novembro de 2026 · Em vigor a partir de: dezembro de 2026";
const UPDATED_EN = "Last updated: November 2026 · Effective from: December 2026";

export const LEGAL = {
  pt: {
    toc: "Nesta página",
    summaryTitle: "Em resumo",
    privacidade: {
      badge: "Legal",
      title: ["Política de ", "Privacidade."],
      updated: UPDATED_PT,
      summary: [
        "Os seus dados de saúde servem apenas para prestar o serviço. Não os vendemos, não os usamos para publicidade e não os usamos para treinar modelos de inteligência artificial.",
        "Só você e os profissionais de saúde que escolher veem o seu historial.",
        "Os dados de saúde ficam alojados na União Europeia, encriptados.",
        "Pode exportar ou apagar os seus dados a qualquer momento.",
      ],
      sections: [
        {
          id: "quem-somos",
          h: "Quem somos",
          body: [
            "A Vivara é explorada pela [denominação social a definir], com sede em [morada a definir], Portugal, NIPC [a definir] («Vivara» ou «nós»).",
            "Para qualquer questão sobre privacidade, escreva para privacidade@vivara.health. Encarregado de proteção de dados: [a definir].",
            "Esta política aplica-se à app para membros, ao portal para médicos e clínicas e a este site. Neste texto, «membro» é a pessoa com conta na app Vivara e «paciente» é a pessoa acompanhada por um médico ou clínica no portal. A mesma pessoa pode ser as duas coisas.",
          ],
        },
        {
          id: "papel",
          h: "O nosso papel em cada caso",
          body: [
            {
              list: [
                "Membros com a app: a Vivara é responsável pelo tratamento da sua conta e dos dados que carrega.",
                "Médicos e clínicas: quando um profissional regista um paciente e acrescenta resultados no portal, é o profissional ou a clínica o responsável por esses dados. A Vivara trata-os apenas por conta dele, como subcontratante (artigo 28.º do RGPD), ao abrigo de um acordo de tratamento de dados.",
              ],
            },
            "Se tiver dúvidas sobre dados que o seu médico registou, pode falar diretamente com ele ou connosco — encaminhamos o pedido.",
          ],
        },
        {
          id: "dados",
          h: "Que dados recolhemos",
          body: [
            {
              list: [
                "Conta: nome, email, palavra-passe (guardada cifrada) e idioma. Para profissionais, também especialidade, número de cédula profissional e clínica.",
                "Saúde: resultados de análises e exames que você ou o seu médico carregam (PDF ou fotografia), os valores lidos desses documentos, e as notas, sintomas e medicação que registar.",
                "Wearables: os dados das apps que decidir ligar (por exemplo, Apple Health, Oura ou Whoop), e só esses.",
                "Pagamento: tratados pelo fornecedor de pagamentos. Não guardamos o número completo do seu cartão.",
                "Técnicos: endereço IP, tipo de dispositivo e browser, e registos de acesso, para segurança e funcionamento.",
                "Recomendações: quem o convidou e quem convidou, para atribuir os meses grátis.",
                "Contacto: o nome, email, perfil e mensagem que nos envia pelo formulário do site.",
              ],
            },
          ],
        },
        {
          id: "finalidades",
          h: "Para que usamos os dados e com que fundamento",
          body: [
            {
              rows: [
                ["Prestar o serviço", "Organizar o seu historial e partilhá-lo com quem escolher. Fundamento: execução do contrato. Para dados de saúde, o seu consentimento explícito, que pode retirar a qualquer momento."],
                ["Portal dos profissionais", "Os dados que um médico ou clínica regista são tratados para a prestação de cuidados de saúde, sob sigilo profissional. O fundamento legal é do profissional, que é o responsável."],
                ["Faturação", "Emitir faturas e cumprir a lei fiscal. Fundamento: obrigação legal."],
                ["Segurança", "Proteger contas e prevenir fraude e abusos. Fundamento: interesse legítimo."],
                ["Responder-lhe", "Tratar mensagens e pedidos de demonstração. Fundamento: interesse legítimo e diligências pré-contratuais."],
                ["Novidades", "Enviar notícias da Vivara, só se aceitar. Pode cancelar em qualquer email."],
                ["Melhorar o serviço", "Estatísticas agregadas, que não identificam ninguém."],
              ],
            },
          ],
        },
        {
          id: "nunca",
          h: "O que nunca fazemos",
          body: [
            {
              list: [
                "Vender dados pessoais.",
                "Usar dados de saúde para publicidade.",
                "Usar os seus dados para treinar modelos de inteligência artificial.",
                "Partilhar dados com seguradoras ou entidades patronais sem pedido seu.",
              ],
            },
          ],
        },
        {
          id: "acesso",
          h: "Quem tem acesso",
          body: [
            {
              list: [
                "Você.",
                "Os profissionais de saúde com quem escolher partilhar. Pode retirar o acesso a qualquer momento; isso não apaga o que o profissional já registou no processo clínico dele, que tem as suas próprias obrigações legais.",
                "Os nossos subcontratantes, apenas no que for necessário e com contrato (lista abaixo).",
                "Autoridades, quando a lei o exigir.",
                "Um eventual comprador ou sucessor da Vivara, com aviso prévio e com as mesmas proteções.",
              ],
            },
          ],
        },
        {
          id: "subcontratantes",
          h: "Subcontratantes",
          body: [
            "Recorremos a prestadores de serviços — por exemplo, de alojamento, pagamentos e envio de emails — que tratam dados apenas por nossa conta, segundo as nossas instruções e com contrato que os obriga a protegê-los. Os que usamos atualmente são:",
            {
              rows: [
                ["Alojamento deste site", "Vercel Inc. · EUA. Não recebe dados de saúde."],
                ["Formulário de contacto", "Web3Forms. Recebe apenas o que escreve no formulário."],
              ],
            },
            "Mantemos esta lista atualizada e acrescentamos cada novo prestador antes de ele começar a tratar dados.",
          ],
        },
        {
          id: "onde",
          h: "Onde ficam os dados",
          body: [
            "Os dados de saúde ficam alojados na União Europeia, encriptados em trânsito e em repouso.",
            "Quando um fornecedor está fora do Espaço Económico Europeu (como no alojamento do site ou no formulário de contacto), a transferência apoia-se numa decisão de adequação da Comissão Europeia ou em cláusulas contratuais-tipo.",
          ],
        },
        {
          id: "ia",
          h: "Leitura automática e inteligência artificial",
          body: [
            "Se usarmos ferramentas automáticas, incluindo inteligência artificial, para ler documentos ou organizar resultados:",
            {
              list: [
                "enviamos apenas o mínimo necessário;",
                "o fornecedor fica proibido de usar os dados para treinar os seus modelos;",
                "a ferramenta não toma decisões clínicas nem decisões com efeitos jurídicos sobre si;",
                "os valores lidos podem ter erros — confirme-os sempre no documento original.",
              ],
            },
          ],
        },
        {
          id: "prazos",
          h: "Quanto tempo guardamos",
          body: [
            {
              list: [
                "Enquanto a sua conta estiver ativa.",
                "Depois de cancelar, os dados ficam disponíveis para exportação durante 90 dias e depois são apagados. As cópias de segurança são apagadas nos 90 dias seguintes.",
                "Pode pedir que apaguemos tudo de imediato; as cópias de segurança são apagadas nos 90 dias seguintes.",
                "Faturas: 10 anos, como exige a lei fiscal.",
                "Mensagens do formulário de contacto: até 12 meses depois do último contacto.",
                "Dados que um médico registou no seu processo clínico seguem as regras de conservação a que ele está obrigado.",
              ],
            },
          ],
        },
        {
          id: "seguranca",
          h: "Segurança",
          body: [
            "Usamos encriptação, controlo e registo de acessos, e autenticação segura. Se houver uma violação de dados, notificamos a CNPD no prazo de 72 horas e informamo-lo diretamente quando houver risco elevado para si.",
          ],
        },
        {
          id: "direitos",
          h: "Os seus direitos",
          body: [
            "Tem direito a aceder aos seus dados, corrigi-los, apagá-los, limitar ou opor-se ao seu tratamento, recebê-los num formato aberto (portabilidade) e retirar o consentimento a qualquer momento.",
            "Para exercer qualquer direito, use a app ou escreva para privacidade@vivara.health. É gratuito e respondemos no prazo de um mês (prorrogável por mais dois em casos complexos, com aviso).",
            "Pode também apresentar reclamação à Comissão Nacional de Proteção de Dados (www.cnpd.pt).",
          ],
        },
        {
          id: "idade",
          h: "Idade mínima",
          body: [
            "A Vivara destina-se apenas a maiores de 18 anos. Não criamos contas para menores e, se soubermos que uma conta pertence a um menor, encerramo-la e apagamos os dados.",
          ],
        },
        {
          id: "cookies",
          h: "Cookies",
          body: [
            "Usamos cookies essenciais para o site funcionar. Cookies de estatística só com o seu consentimento, dado na barra que aparece na primeira visita. Pode mudar a escolha a qualquer momento em «Preferências de cookies», no rodapé do site.",
          ],
        },
        {
          id: "alteracoes",
          h: "Alterações a esta política",
          body: [
            "Se fizermos alterações relevantes, avisamos por email ou na app pelo menos 30 dias antes. Nunca reduzimos os seus direitos sobre dados já recolhidos sem o seu consentimento.",
          ],
        },
      ],
    },
    termos: {
      badge: "Legal",
      title: ["Termos de ", "Serviço."],
      updated: UPDATED_PT,
      summary: [
        "A Vivara organiza resultados e historial clínico. Não presta cuidados de saúde nem dá conselhos médicos.",
        "Em caso de emergência, ligue 112. Para aconselhamento, ligue SNS 24: 808 24 24 24.",
        "Pode cancelar a qualquer momento; o plano termina no fim do período pago.",
        "Os seus dados são seus: pode exportá-los sempre.",
      ],
      sections: [
        {
          id: "quem-somos",
          h: "Quem somos",
          body: [
            "Estes termos regulam a utilização da Vivara, explorada pela [denominação social a definir], com sede em [morada a definir], Portugal, NIPC [a definir]. Ao criar uma conta, aceita estes termos e a Política de Privacidade.",
          ],
        },
        {
          id: "servico",
          h: "O que é a Vivara — e o que não é",
          body: [
            "A Vivara tem dois acessos: uma app para membros e um portal para médicos e clínicas. Ambos servem para reunir resultados de análises, exames e registos num só historial. Neste texto, «membro» é a pessoa com conta na app Vivara e «paciente» é a pessoa acompanhada por um médico ou clínica no portal. A mesma pessoa pode ser as duas coisas.",
            {
              list: [
                "A Vivara não presta cuidados de saúde, não faz diagnósticos e não substitui o seu médico.",
                "Os avisos e gráficos da plataforma são informativos. As decisões clínicas são sempre do profissional de saúde.",
                "A Vivara não é monitorizada em tempo real. Em emergência, ligue 112.",
              ],
            },
          ],
        },
        {
          id: "conta",
          h: "A sua conta",
          body: [
            "Tem de ter 18 anos ou mais e dar informação verdadeira. A conta é pessoal e intransmissível: guarde as suas credenciais em segurança e avise-nos se suspeitar de uso indevido.",
          ],
        },
        {
          id: "utentes",
          h: "Para membros",
          body: [
            {
              list: [
                "Pode carregar resultados em PDF ou fotografia. Os valores lidos automaticamente podem ter erros: confirme-os no documento original.",
                "Escolhe com que profissionais partilha o seu historial e pode retirar o acesso a qualquer momento.",
                "Os dados de wearables são estimativas dos respetivos dispositivos e aparecem sempre separados das análises de laboratório. Dependem das apps de terceiros (como Apple Health, Oura ou Whoop) e dos termos delas.",
              ],
            },
          ],
        },
        {
          id: "profissionais",
          h: "Para médicos e clínicas",
          body: [
            {
              list: [
                "Declara estar legalmente habilitado para exercer e inscrito na respetiva ordem profissional.",
                "Só regista pacientes e carrega os seus dados quando tem fundamento legal para isso, e mantém o sigilo profissional.",
                "É o responsável pelo tratamento dos dados que regista. A Vivara atua como sua subcontratante, nos termos do /acordo-medicos, que faz parte destes termos.",
                "O plano Individual é para um profissional. Para clínicas com 2 ou mais profissionais, as condições são acordadas por escrito.",
                "Cada profissional tem o seu próprio acesso. Não partilhe credenciais.",
              ],
            },
          ],
        },
        {
          id: "precos",
          h: "Planos, preços e pagamento",
          body: [
            {
              rows: [
                ["Membro", "€6,99 por mês ou €79 por ano."],
                ["Médico individual", "€29,99 por mês ou €320 por ano."],
                ["Clínica (2 ou mais profissionais)", "Sob consulta."],
              ],
            },
            "Os preços incluem IVA à taxa legal em vigor. O pagamento é feito no início de cada período, através de um prestador de serviços de pagamento, e o plano renova automaticamente.",
            "Se alterarmos um preço, avisamos pelo menos 30 dias antes; pode cancelar antes de a alteração produzir efeito. Se um pagamento falhar, avisamos e podemos suspender o acesso até à regularização — os seus dados não são apagados por isso.",
          ],
        },
        {
          id: "cancelamento",
          h: "Cancelamento e livre resolução",
          body: [
            "Pode cancelar a qualquer momento na app, no portal ou por email. O cancelamento produz efeito no fim do período já pago e não há reembolso de períodos parciais, salvo quando a lei o exija.",
            "Se for consumidor, tem 14 dias a contar da subscrição para desistir sem indicar motivo. Se pediu para começar a usar o serviço nesse prazo, pode ser cobrado o valor proporcional ao tempo já usado.",
          ],
        },
        {
          id: "recomendacoes",
          h: "Programa de recomendação",
          body: [
            {
              list: [
                "Quando um membro recomenda outro membro, ou um médico recomenda outro médico, ambos ganham um mês grátis.",
                "Quando um membro recomenda o seu médico, ambos ganham um mês grátis.",
                "Quando um médico recomenda a Vivara a um paciente, só o paciente ganha um mês grátis.",
                "O mês é atribuído depois do primeiro pagamento de quem foi convidado. Máximo de 12 meses grátis por ano. Nos planos anuais, o mês grátis prolonga a subscrição. Nos planos de clínica, as condições são acordadas.",
              ],
            },
            "Podemos alterar ou terminar o programa com aviso prévio, sem afetar meses já ganhos.",
          ],
        },
        {
          id: "dados",
          h: "Os seus dados",
          body: [
            "Os dados que carrega são seus. Dá-nos apenas a autorização necessária para os guardar e tratar com o objetivo de lhe prestar o serviço, como descrito na Política de Privacidade.",
            "Pode exportar tudo num formato aberto a qualquer momento. Depois de cancelar, os dados ficam disponíveis para exportação durante 90 dias e depois são apagados.",
          ],
        },
        {
          id: "uso",
          h: "Utilização aceitável",
          body: [
            "Não pode:",
            {
              list: [
                "carregar dados de outra pessoa sem autorização (salvo profissionais de saúde com fundamento legal);",
                "tentar aceder a contas ou dados de terceiros;",
                "copiar, desmontar ou fazer engenharia inversa da plataforma;",
                "recolher dados de forma automatizada ou revender o serviço.",
              ],
            },
          ],
        },
        {
          id: "disponibilidade",
          h: "Disponibilidade e alterações do serviço",
          body: [
            "Fazemos o possível para que a Vivara esteja sempre disponível, mas pode haver interrupções para manutenção ou por causas alheias. Podemos melhorar e alterar funcionalidades; se retirarmos algo essencial ao seu plano, avisamos e pode cancelar.",
          ],
        },
        {
          id: "propriedade",
          h: "Propriedade intelectual",
          body: [
            "A plataforma, a marca e os conteúdos da Vivara pertencem à Vivara. Estes termos não lhe transmitem nenhum direito sobre eles, além do direito de usar o serviço.",
          ],
        },
        {
          id: "responsabilidade",
          h: "Responsabilidade",
          body: [
            "A Vivara responde nos termos da lei. Não respondemos por decisões clínicas tomadas por profissionais, por erros nos documentos de origem (por exemplo, do laboratório) nem por serviços de terceiros, como os wearables.",
            "Nada nestes termos limita a nossa responsabilidade por dolo ou culpa grave, nem os direitos que a lei garante aos consumidores.",
          ],
        },
        {
          id: "suspensao",
          h: "Suspensão e fim da conta",
          body: [
            "Pode encerrar a sua conta a qualquer momento. Podemos suspender ou encerrar uma conta em caso de violação grave destes termos, com aviso prévio, salvo urgência ou obrigação legal.",
          ],
        },
        {
          id: "alteracoes",
          h: "Alterações a estes termos",
          body: [
            "Avisamos por email ou na app pelo menos 30 dias antes de alterações relevantes. Se não concordar, pode cancelar antes de entrarem em vigor.",
          ],
        },
        {
          id: "lei",
          h: "Lei aplicável e litígios",
          body: [
            "Estes termos regem-se pela lei portuguesa. Se for consumidor, mantém a proteção das normas imperativas do seu país de residência.",
            "Em caso de litígio de consumo, pode recorrer ao CNIACC — Centro Nacional de Informação e Arbitragem de Conflitos de Consumo (www.cniacc.pt) ou ao centro de arbitragem de consumo da sua área de residência. Mais informação no Portal do Consumidor (www.consumidor.gov.pt). Dispomos de Livro de Reclamações Eletrónico (www.livroreclamacoes.pt).",
            "Para profissionais, é competente o tribunal da comarca da sede da Vivara.",
          ],
        },
        {
          id: "contacto",
          h: "Contacto",
          body: ["equipa@vivara.health · [morada a definir], Portugal."],
        },
      ],
    },
    acordo: {
      badge: "Legal",
      title: ["Acordo de Tratamento ", "de Dados."],
      updated: UPDATED_PT,
      summary: [
        "Este acordo aplica-se a médicos e clínicas que usam o portal da Vivara. O profissional é o responsável pelos dados dos seus pacientes; a Vivara trata-os apenas por conta dele.",
        "Só usamos os dados para prestar o serviço. Nunca para fins próprios, publicidade ou treino de modelos de inteligência artificial.",
        "Aceita este acordo ao criar a conta. Faz parte dos Termos de Serviço.",
      ],
      sections: [
        {
          id: "partes",
          h: "Partes e objeto",
          body: [
            "Este acordo é celebrado entre o profissional de saúde ou clínica que cria a conta no portal («Responsável pelo tratamento» ou «Profissional») e a Vivara, explorada pela [denominação social a definir] («Subcontratante»), ao abrigo do artigo 28.º do Regulamento Geral sobre a Proteção de Dados (RGPD).",
            "Define como a Vivara trata, por conta do Profissional, os dados pessoais dos pacientes que ele regista e acompanha no portal.",
          ],
        },
        {
          id: "tratamento",
          h: "Que dados e para quê",
          body: [
            {
              rows: [
                ["Finalidade", "Organizar o historial clínico dos pacientes do Profissional: guardar resultados, exames e registos, mostrá-los em linha do tempo e disponibilizá-los ao Profissional."],
                ["Operações", "Alojamento, armazenamento, consulta, organização, leitura de documentos carregados, exportação e apagamento."],
                ["Categorias de dados", "Identificação e contacto do paciente; dados de saúde (resultados de análises e exames, notas, sintomas, medicação e, se o paciente os ligar, dados de wearables)."],
                ["Titulares", "Os pacientes do Profissional."],
                ["Duração", "Enquanto a conta do Profissional estiver ativa e até ao fim do prazo de devolução e apagamento (ver «Fim do acordo»)."],
              ],
            },
          ],
        },
        {
          id: "instrucoes",
          h: "Instruções do Profissional",
          body: [
            "A Vivara trata os dados apenas segundo as instruções documentadas do Profissional, que são este acordo e o uso normal do portal. Não os usa para fins próprios, publicidade, nem para treinar modelos de inteligência artificial.",
            "Se a Vivara considerar que uma instrução viola a lei, avisa o Profissional.",
            "O Profissional garante que tem fundamento legal para registar os dados dos seus pacientes e que mantém o sigilo profissional a que está obrigado.",
          ],
        },
        {
          id: "confidencialidade",
          h: "Confidencialidade",
          body: [
            "Só tem acesso aos dados quem precisa deles para prestar o serviço, e todas essas pessoas estão obrigadas a confidencialidade.",
          ],
        },
        {
          id: "seguranca",
          h: "Segurança",
          body: [
            "A Vivara aplica medidas técnicas e organizativas adequadas ao risco, incluindo:",
            {
              list: [
                "encriptação dos dados em trânsito e em repouso;",
                "controlo, registo e revisão dos acessos;",
                "autenticação segura;",
                "cópias de segurança;",
                "alojamento dos dados de saúde na União Europeia.",
              ],
            },
          ],
        },
        {
          id: "subcontratantes",
          h: "Outros prestadores",
          body: [
            "O Profissional autoriza a Vivara a recorrer a outros prestadores (por exemplo, alojamento, pagamentos ou envio de emails). A Vivara impõe-lhes obrigações de proteção de dados equivalentes às deste acordo e continua responsável perante o Profissional.",
            "A lista atual está na Política de Privacidade. Antes de acrescentar um novo prestador que trate dados dos pacientes, a Vivara avisa o Profissional, que pode opor-se; se a oposição for fundamentada e não houver alternativa, o Profissional pode cessar o acordo.",
          ],
        },
        {
          id: "transferencias",
          h: "Transferências para fora da UE",
          body: [
            "Os dados de saúde ficam na União Europeia. Qualquer transferência para fora do Espaço Económico Europeu só se faz com garantias previstas no RGPD, como uma decisão de adequação ou cláusulas contratuais-tipo.",
          ],
        },
        {
          id: "direitos",
          h: "Direitos dos pacientes",
          body: [
            "Se um paciente pedir à Vivara o acesso, a retificação, o apagamento ou outro direito sobre dados que o Profissional registou, a Vivara encaminha o pedido ao Profissional sem demora. A Vivara ajuda o Profissional a responder, dentro do que o portal permite (por exemplo, exportar ou apagar os dados de um paciente).",
          ],
        },
        {
          id: "violacoes",
          h: "Violações de dados",
          body: [
            "Se a Vivara souber de uma violação de dados que afete os pacientes do Profissional, avisa-o sem demora injustificada e, sempre que possível, nas 48 horas seguintes. Indica o que aconteceu, que dados estão em causa e o que está a ser feito, para o Profissional poder cumprir os seus deveres, incluindo notificar a CNPD no prazo de 72 horas quando for obrigatório.",
          ],
        },
        {
          id: "ajuda",
          h: "Outra ajuda ao Profissional",
          body: [
            "A Vivara ajuda o Profissional a cumprir as obrigações de segurança, de avaliação de impacto sobre a proteção de dados e de consulta prévia à CNPD, na medida do que o serviço permite e da informação de que dispõe.",
          ],
        },
        {
          id: "provas",
          h: "Provas e auditorias",
          body: [
            "A Vivara disponibiliza ao Profissional a informação necessária para demonstrar o cumprimento deste acordo e permite verificações razoáveis, com aviso prévio, por si ou por um auditor que o Profissional indique. Estas verificações não podem pôr em risco os dados de outros clientes.",
          ],
        },
        {
          id: "fim",
          h: "Fim do acordo",
          body: [
            "Quando a conta do Profissional termina, a Vivara devolve-lhe os dados num formato aberto, disponível para exportação durante 90 dias. Depois disso, apaga-os, incluindo as cópias de segurança nos 90 dias seguintes, salvo se a lei exigir a sua conservação.",
          ],
        },
        {
          id: "lei",
          h: "Lei aplicável",
          body: [
            "Este acordo rege-se pela lei portuguesa e faz parte dos Termos de Serviço. Em caso de contradição sobre o tratamento de dados pessoais, prevalece este acordo.",
          ],
        },
      ],
    },
  },

  en: {
    toc: "On this page",
    summaryTitle: "In short",
    privacidade: {
      badge: "Legal",
      title: ["Privacy ", "Policy."],
      updated: UPDATED_EN,
      summary: [
        "Your health data is used only to provide the service. We don't sell it, we don't use it for advertising and we don't use it to train artificial intelligence models.",
        "Only you and the healthcare professionals you choose can see your record.",
        "Health data is hosted in the European Union, encrypted.",
        "You can export or delete your data at any time.",
      ],
      sections: [
        {
          id: "quem-somos",
          h: "Who we are",
          body: [
            "Vivara is operated by [company name to be defined], headquartered at [address to be defined], Portugal, tax number [to be defined] (\"Vivara\" or \"we\").",
            "For any privacy question, write to privacidade@vivara.health. Data protection officer: [to be defined].",
            "This policy covers the member app, the portal for doctors and clinics, and this website. In this text, a \"member\" is a person with an account in the Vivara app and a \"patient\" is a person followed by a doctor or clinic in the portal. The same person can be both.",
          ],
        },
        {
          id: "papel",
          h: "Our role in each case",
          body: [
            {
              list: [
                "Members using the app: Vivara is the controller of your account and of the data you upload.",
                "Doctors and clinics: when a professional registers a patient and adds results in the portal, the professional or clinic is the controller of that data. Vivara processes it only on their behalf, as a processor (Article 28 GDPR), under a data processing agreement.",
              ],
            },
            "If you have questions about data your doctor recorded, you can speak to them directly or to us — we will pass the request on.",
          ],
        },
        {
          id: "dados",
          h: "What data we collect",
          body: [
            {
              list: [
                "Account: name, email, password (stored encrypted) and language. For professionals, also speciality, professional licence number and clinic.",
                "Health: lab and exam results that you or your doctor upload (PDF or photo), the values read from those documents, and any notes, symptoms and medication you record.",
                "Wearables: data from the apps you choose to connect (for example Apple Health, Oura or Whoop), and only those.",
                "Payment: handled by the payment provider. We don't store your full card number.",
                "Technical: IP address, device and browser type, and access logs, for security and operation.",
                "Referrals: who invited you and whom you invited, to award free months.",
                "Contact: the name, email, profile and message you send us through the website form.",
              ],
            },
          ],
        },
        {
          id: "finalidades",
          h: "What we use data for, and on what basis",
          body: [
            {
              rows: [
                ["Providing the service", "Organising your record and sharing it with whomever you choose. Basis: performance of the contract. For health data, your explicit consent, which you can withdraw at any time."],
                ["Professional portal", "Data a doctor or clinic records is processed for the provision of healthcare, under professional secrecy. The legal basis belongs to the professional, who is the controller."],
                ["Billing", "Issuing invoices and complying with tax law. Basis: legal obligation."],
                ["Security", "Protecting accounts and preventing fraud and abuse. Basis: legitimate interest."],
                ["Replying to you", "Handling messages and demo requests. Basis: legitimate interest and pre-contractual steps."],
                ["News", "Sending Vivara news, only if you agree. You can unsubscribe from any email."],
                ["Improving the service", "Aggregated statistics that don't identify anyone."],
              ],
            },
          ],
        },
        {
          id: "nunca",
          h: "What we never do",
          body: [
            {
              list: [
                "Sell personal data.",
                "Use health data for advertising.",
                "Use your data to train artificial intelligence models.",
                "Share data with insurers or employers unless you ask us to.",
              ],
            },
          ],
        },
        {
          id: "acesso",
          h: "Who has access",
          body: [
            {
              list: [
                "You.",
                "The healthcare professionals you choose to share with. You can withdraw access at any time; this doesn't delete what the professional has already recorded in their own clinical file, which has its own legal obligations.",
                "Our processors, only as needed and under contract (list below).",
                "Authorities, when required by law.",
                "A potential buyer or successor of Vivara, with prior notice and the same protections.",
              ],
            },
          ],
        },
        {
          id: "subcontratantes",
          h: "Processors",
          body: [
            "We use service providers — for example for hosting, payments and email delivery — that process data only on our behalf, following our instructions and under contracts that require them to protect it. The ones we currently use are:",
            {
              rows: [
                ["Hosting of this website", "Vercel Inc. · USA. Receives no health data."],
                ["Contact form", "Web3Forms. Receives only what you write in the form."],
              ],
            },
            "We keep this list up to date and add each new provider before it starts processing data.",
          ],
        },
        {
          id: "onde",
          h: "Where data is stored",
          body: [
            "Health data is hosted in the European Union, encrypted in transit and at rest.",
            "When a provider is outside the European Economic Area (such as website hosting or the contact form), the transfer relies on a European Commission adequacy decision or on standard contractual clauses.",
          ],
        },
        {
          id: "ia",
          h: "Automatic reading and artificial intelligence",
          body: [
            "If we use automated tools, including artificial intelligence, to read documents or organise results:",
            {
              list: [
                "we send only the minimum necessary;",
                "the provider is prohibited from using the data to train its models;",
                "the tool makes no clinical decisions and no decisions with legal effects on you;",
                "the values read may contain errors — always check them against the original document.",
              ],
            },
          ],
        },
        {
          id: "prazos",
          h: "How long we keep data",
          body: [
            {
              list: [
                "For as long as your account is active.",
                "After you cancel, data remains available for export for 90 days and is then deleted. Backups are deleted within the following 90 days.",
                "You can ask us to delete everything immediately; backups are deleted within the following 90 days.",
                "Invoices: 10 years, as required by tax law.",
                "Contact form messages: up to 12 months after the last contact.",
                "Data a doctor recorded in their clinical file follows the retention rules that apply to them.",
              ],
            },
          ],
        },
        {
          id: "seguranca",
          h: "Security",
          body: [
            "We use encryption, access control and logging, and secure authentication. If there is a data breach, we notify the Portuguese data protection authority (CNPD) within 72 hours and inform you directly when there is a high risk to you.",
          ],
        },
        {
          id: "direitos",
          h: "Your rights",
          body: [
            "You have the right to access your data, correct it, delete it, restrict or object to its processing, receive it in an open format (portability) and withdraw consent at any time.",
            "To exercise any right, use the app or write to privacidade@vivara.health. It is free and we reply within one month (extendable by two more in complex cases, with notice).",
            "You can also lodge a complaint with the Portuguese data protection authority, CNPD (www.cnpd.pt).",
          ],
        },
        {
          id: "idade",
          h: "Minimum age",
          body: [
            "Vivara is intended only for people aged 18 or over. We don't create accounts for minors and, if we learn that an account belongs to a minor, we close it and delete the data.",
          ],
        },
        {
          id: "cookies",
          h: "Cookies",
          body: [
            "We use essential cookies for the website to work. Analytics cookies only with your consent, given in the bar shown on your first visit. You can change your choice at any time under \"Cookie preferences\" in the website footer.",
          ],
        },
        {
          id: "alteracoes",
          h: "Changes to this policy",
          body: [
            "If we make relevant changes, we notify you by email or in the app at least 30 days in advance. We never reduce your rights over data already collected without your consent.",
          ],
        },
      ],
    },
    termos: {
      badge: "Legal",
      title: ["Terms of ", "Service."],
      updated: UPDATED_EN,
      summary: [
        "Vivara organises results and clinical history. It does not provide healthcare or medical advice.",
        "In an emergency, call 112. For health advice in Portugal, call SNS 24: 808 24 24 24.",
        "You can cancel at any time; your plan ends at the end of the paid period.",
        "Your data is yours: you can always export it.",
      ],
      sections: [
        {
          id: "quem-somos",
          h: "Who we are",
          body: [
            "These terms govern the use of Vivara, operated by [company name to be defined], headquartered at [address to be defined], Portugal, tax number [to be defined]. By creating an account, you accept these terms and the Privacy Policy.",
          ],
        },
        {
          id: "servico",
          h: "What Vivara is — and isn't",
          body: [
            "Vivara has two kinds of access: an app for members and a portal for doctors and clinics. Both bring lab results, exams and records together in a single history. In this text, a \"member\" is a person with an account in the Vivara app and a \"patient\" is a person followed by a doctor or clinic in the portal. The same person can be both.",
            {
              list: [
                "Vivara does not provide healthcare, does not diagnose and does not replace your doctor.",
                "The platform's alerts and charts are for information. Clinical decisions always belong to the healthcare professional.",
                "Vivara is not monitored in real time. In an emergency, call 112.",
              ],
            },
          ],
        },
        {
          id: "conta",
          h: "Your account",
          body: [
            "You must be 18 or over and provide accurate information. The account is personal and non-transferable: keep your credentials safe and tell us if you suspect misuse.",
          ],
        },
        {
          id: "utentes",
          h: "For members",
          body: [
            {
              list: [
                "You can upload results as a PDF or photo. Values read automatically may contain errors: check them against the original document.",
                "You choose which professionals you share your record with and can withdraw access at any time.",
                "Wearable data are estimates from the respective devices and are always shown separately from lab results. They depend on third-party apps (such as Apple Health, Oura or Whoop) and their terms.",
              ],
            },
          ],
        },
        {
          id: "profissionais",
          h: "For doctors and clinics",
          body: [
            {
              list: [
                "You confirm you are legally qualified to practise and registered with the relevant professional body.",
                "You only register patients and upload their data when you have a legal basis to do so, and you keep professional secrecy.",
                "You are the controller of the data you record. Vivara acts as your processor under the /acordo-medicos, which forms part of these terms.",
                "The Individual plan is for one professional. For clinics with 2 or more professionals, terms are agreed in writing.",
                "Each professional has their own access. Don't share credentials.",
              ],
            },
          ],
        },
        {
          id: "precos",
          h: "Plans, prices and payment",
          body: [
            {
              rows: [
                ["Member", "€6.99 per month or €79 per year."],
                ["Individual doctor", "€29.99 per month or €320 per year."],
                ["Clinic (2 or more professionals)", "On request."],
              ],
            },
            "Prices include VAT at the applicable rate. Payment is made at the start of each period, through a payment service provider, and the plan renews automatically.",
            "If we change a price, we notify you at least 30 days in advance; you can cancel before the change takes effect. If a payment fails, we let you know and may suspend access until it is settled — your data is not deleted because of it.",
          ],
        },
        {
          id: "cancelamento",
          h: "Cancellation and right of withdrawal",
          body: [
            "You can cancel at any time in the app, in the portal or by email. Cancellation takes effect at the end of the period already paid and partial periods are not refunded, unless the law requires it.",
            "If you are a consumer, you have 14 days from subscribing to withdraw without giving a reason. If you asked to start using the service within that period, you may be charged for the time already used.",
          ],
        },
        {
          id: "recomendacoes",
          h: "Referral programme",
          body: [
            {
              list: [
                "When a member recommends another member, or a doctor recommends another doctor, both get a free month.",
                "When a member recommends their doctor, both get a free month.",
                "When a doctor recommends Vivara to a patient, only the patient gets a free month.",
                "The month is awarded after the invitee's first payment. Up to 12 free months per year. On annual plans, the free month extends the subscription. For clinic plans, terms are agreed.",
              ],
            },
            "We may change or end the programme with prior notice, without affecting months already earned.",
          ],
        },
        {
          id: "dados",
          h: "Your data",
          body: [
            "The data you upload is yours. You give us only the permission needed to store and process it in order to provide the service, as described in the Privacy Policy.",
            "You can export everything in an open format at any time. After you cancel, data remains available for export for 90 days and is then deleted.",
          ],
        },
        {
          id: "uso",
          h: "Acceptable use",
          body: [
            "You may not:",
            {
              list: [
                "upload another person's data without authorisation (except healthcare professionals with a legal basis);",
                "try to access other people's accounts or data;",
                "copy, decompile or reverse-engineer the platform;",
                "collect data automatically or resell the service.",
              ],
            },
          ],
        },
        {
          id: "disponibilidade",
          h: "Availability and changes to the service",
          body: [
            "We do our best to keep Vivara always available, but there may be interruptions for maintenance or for reasons beyond our control. We may improve and change features; if we remove something essential to your plan, we will tell you and you can cancel.",
          ],
        },
        {
          id: "propriedade",
          h: "Intellectual property",
          body: [
            "The platform, brand and content of Vivara belong to Vivara. These terms give you no rights over them beyond the right to use the service.",
          ],
        },
        {
          id: "responsabilidade",
          h: "Liability",
          body: [
            "Vivara is liable as provided by law. We are not liable for clinical decisions made by professionals, for errors in source documents (for example from the lab), or for third-party services such as wearables.",
            "Nothing in these terms limits our liability for wilful misconduct or gross negligence, nor the rights the law grants consumers.",
          ],
        },
        {
          id: "suspensao",
          h: "Suspension and closing your account",
          body: [
            "You can close your account at any time. We may suspend or close an account for a serious breach of these terms, with prior notice, except in urgent cases or where the law requires otherwise.",
          ],
        },
        {
          id: "alteracoes",
          h: "Changes to these terms",
          body: [
            "We notify you by email or in the app at least 30 days before relevant changes. If you don't agree, you can cancel before they take effect.",
          ],
        },
        {
          id: "lei",
          h: "Governing law and disputes",
          body: [
            "These terms are governed by Portuguese law. If you are a consumer, you keep the protection of the mandatory rules of your country of residence.",
            "For consumer disputes, you can turn to CNIACC — the Portuguese National Centre for Consumer Arbitration (www.cniacc.pt) — or to the consumer arbitration centre for your area of residence. More information on the Portuguese Consumer Portal (www.consumidor.gov.pt). We have an Electronic Complaints Book (www.livroreclamacoes.pt).",
            "For professionals, the court of the district of Vivara's registered office has jurisdiction.",
          ],
        },
        {
          id: "contacto",
          h: "Contact",
          body: ["equipa@vivara.health · [address to be defined], Portugal."],
        },
      ],
    },
    acordo: {
      badge: "Legal",
      title: ["Data Processing ", "Agreement."],
      updated: UPDATED_EN,
      summary: [
        "This agreement applies to doctors and clinics using the Vivara portal. The professional is the controller of their patients' data; Vivara processes it only on their behalf.",
        "We use the data only to provide the service. Never for our own purposes, advertising or training artificial intelligence models.",
        "You accept this agreement when you create your account. It forms part of the Terms of Service.",
      ],
      sections: [
        {
          id: "partes",
          h: "Parties and subject matter",
          body: [
            "This agreement is between the healthcare professional or clinic that creates an account on the portal (the \"Controller\" or \"Professional\") and Vivara, operated by [company name to be defined] (the \"Processor\"), under Article 28 of the General Data Protection Regulation (GDPR).",
            "It sets out how Vivara processes, on the Professional's behalf, the personal data of patients that the Professional registers and follows in the portal.",
          ],
        },
        {
          id: "tratamento",
          h: "What data and for what purpose",
          body: [
            {
              rows: [
                ["Purpose", "Organising the clinical history of the Professional's patients: storing results, exams and records, showing them on a timeline and making them available to the Professional."],
                ["Operations", "Hosting, storage, retrieval, organisation, reading of uploaded documents, export and deletion."],
                ["Categories of data", "Patient identification and contact details; health data (lab and exam results, notes, symptoms, medication and, if the patient connects them, wearable data)."],
                ["Data subjects", "The Professional's patients."],
                ["Duration", "While the Professional's account is active and until the end of the return and deletion period (see \"End of the agreement\")."],
              ],
            },
          ],
        },
        {
          id: "instrucoes",
          h: "The Professional's instructions",
          body: [
            "Vivara processes the data only on the Professional's documented instructions, which are this agreement and normal use of the portal. It does not use the data for its own purposes, advertising or to train artificial intelligence models.",
            "If Vivara believes an instruction infringes the law, it will tell the Professional.",
            "The Professional confirms they have a legal basis to record their patients' data and that they keep the professional secrecy they are bound by.",
          ],
        },
        {
          id: "confidencialidade",
          h: "Confidentiality",
          body: [
            "Only people who need the data to provide the service can access it, and all of them are bound by confidentiality.",
          ],
        },
        {
          id: "seguranca",
          h: "Security",
          body: [
            "Vivara applies technical and organisational measures appropriate to the risk, including:",
            {
              list: [
                "encryption of data in transit and at rest;",
                "access control, logging and review;",
                "secure authentication;",
                "backups;",
                "hosting of health data in the European Union.",
              ],
            },
          ],
        },
        {
          id: "subcontratantes",
          h: "Other providers",
          body: [
            "The Professional authorises Vivara to use other providers (for example for hosting, payments or email delivery). Vivara imposes on them data protection obligations equivalent to those in this agreement and remains responsible to the Professional.",
            "The current list is in the Privacy Policy. Before adding a new provider that processes patient data, Vivara tells the Professional, who may object; if the objection is well founded and there is no alternative, the Professional may end the agreement.",
          ],
        },
        {
          id: "transferencias",
          h: "Transfers outside the EU",
          body: [
            "Health data stays in the European Union. Any transfer outside the European Economic Area is made only with safeguards provided by the GDPR, such as an adequacy decision or standard contractual clauses.",
          ],
        },
        {
          id: "direitos",
          h: "Patients' rights",
          body: [
            "If a patient asks Vivara for access, rectification, erasure or another right over data the Professional recorded, Vivara passes the request to the Professional without delay. Vivara helps the Professional respond, within what the portal allows (for example by exporting or deleting a patient's data).",
          ],
        },
        {
          id: "violacoes",
          h: "Data breaches",
          body: [
            "If Vivara becomes aware of a data breach affecting the Professional's patients, it tells the Professional without undue delay and, where possible, within 48 hours. It says what happened, what data is involved and what is being done, so the Professional can meet their duties, including notifying the Portuguese data protection authority (CNPD) within 72 hours when required.",
          ],
        },
        {
          id: "ajuda",
          h: "Other assistance to the Professional",
          body: [
            "Vivara helps the Professional comply with obligations on security, data protection impact assessments and prior consultation with the CNPD, to the extent the service allows and with the information it holds.",
          ],
        },
        {
          id: "provas",
          h: "Evidence and audits",
          body: [
            "Vivara makes available to the Professional the information needed to show compliance with this agreement and allows reasonable checks, with prior notice, by the Professional or an auditor they appoint. These checks may not put other customers' data at risk.",
          ],
        },
        {
          id: "fim",
          h: "End of the agreement",
          body: [
            "When the Professional's account ends, Vivara returns the data in an open format, available for export for 90 days. After that it deletes it, including backups within the following 90 days, unless the law requires it to be kept.",
          ],
        },
        {
          id: "lei",
          h: "Governing law",
          body: [
            "This agreement is governed by Portuguese law and forms part of the Terms of Service. If there is a conflict over the processing of personal data, this agreement prevails.",
          ],
        },
      ],
    },
  },
};
