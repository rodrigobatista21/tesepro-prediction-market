'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, FileText, Calendar, Mail, ChevronDown, ChevronUp, AlertTriangle, Shield, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const LAST_UPDATED = '10 de dezembro de 2024'
const VERSION = '1.0'

interface Section {
  id: string
  title: string
  content: React.ReactNode
}

const sections: Section[] = [
  {
    id: 'aceitacao',
    title: '1. Aceitação dos Termos',
    content: (
      <div className="space-y-4">
        <p>
          Ao acessar ou utilizar a plataforma Prever ("Plataforma", "Serviço" ou "nós"), você ("Usuário" ou "você") concorda expressamente em estar vinculado a estes Termos e Condições de Uso ("Termos"), bem como à nossa Política de Privacidade.
        </p>
        <p>
          <strong>Se você não concorda com qualquer parte destes Termos, não deve utilizar nossa Plataforma.</strong>
        </p>
        <p>
          A versão mais atual destes Termos estará sempre disponível nesta página. É sua responsabilidade revisar periodicamente os Termos para estar ciente de quaisquer alterações. O uso continuado da Plataforma após a publicação de alterações constitui sua aceitação dessas modificações.
        </p>
        <p>
          Estes Termos constituem um contrato legalmente vinculante entre você e a Prever, regido pelas leis da República Federativa do Brasil.
        </p>
      </div>
    )
  },
  {
    id: 'definicoes',
    title: '2. Definições',
    content: (
      <div className="space-y-4">
        <p>Para fins destes Termos, as seguintes definições se aplicam:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Plataforma:</strong> O website, aplicativo e todos os serviços oferecidos pela Prever.</li>
          <li><strong>Usuário:</strong> Qualquer pessoa física que se cadastra e utiliza a Plataforma.</li>
          <li><strong>Conta:</strong> O cadastro pessoal e intransferível do Usuário na Plataforma.</li>
          <li><strong>Mercado:</strong> Um evento sobre o qual os Usuários podem fazer previsões, com resultado binário (SIM ou NÃO).</li>
          <li><strong>Contrato ou Ação:</strong> Uma unidade de participação em um Mercado, que vale R$ 1,00 se a previsão estiver correta ao final.</li>
          <li><strong>Posição:</strong> A escolha do Usuário em um Mercado (SIM ou NÃO).</li>
          <li><strong>Order Book:</strong> O livro de ofertas onde compradores e vendedores definem preços para negociação.</li>
          <li><strong>Resolução:</strong> O processo de determinação do resultado final de um Mercado.</li>
          <li><strong>Saldo:</strong> O valor disponível na Conta do Usuário para negociação.</li>
          <li><strong>PIX:</strong> Sistema de pagamento instantâneo brasileiro operado pelo Banco Central.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'elegibilidade',
    title: '3. Elegibilidade',
    content: (
      <div className="space-y-4">
        <p>Para utilizar a Plataforma, você deve:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Ter pelo menos 18 (dezoito) anos de idade</strong> ou a maioridade legal em sua jurisdição, o que for maior;</li>
          <li>Possuir capacidade civil plena para celebrar contratos vinculantes;</li>
          <li>Ser residente no Brasil ou em jurisdição onde o uso da Plataforma seja permitido;</li>
          <li>Não estar proibido de usar a Plataforma por lei aplicável.</li>
        </ul>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-4">
          <p className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Proibições Específicas
          </p>
          <p className="mt-2 text-sm">
            Estão expressamente proibidos de negociar em determinados Mercados:
          </p>
          <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
            <li>Pessoas com informações privilegiadas sobre o resultado do evento;</li>
            <li>Participantes diretos do evento objeto do Mercado;</li>
            <li>Funcionários, dirigentes ou pessoas com poder de influência sobre o resultado;</li>
            <li>Familiares diretos das pessoas acima mencionadas.</li>
          </ul>
        </div>
        <p className="mt-4">
          A Prever reserva-se o direito de solicitar documentação comprobatória de elegibilidade a qualquer momento e de suspender ou encerrar Contas que violem estes requisitos.
        </p>
      </div>
    )
  },
  {
    id: 'conta',
    title: '4. Conta do Usuário',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">4.1 Criação de Conta</h4>
        <p>
          Para utilizar a Plataforma, você deve criar uma Conta fornecendo informações verdadeiras, precisas e completas. Você é responsável por manter essas informações atualizadas.
        </p>

        <h4 className="font-semibold">4.2 Uma Conta por Pessoa</h4>
        <p>
          Cada pessoa física pode possuir apenas uma Conta. A criação de múltiplas Contas é estritamente proibida e pode resultar no encerramento de todas as Contas associadas.
        </p>

        <h4 className="font-semibold">4.3 Segurança da Conta</h4>
        <p>
          Você é responsável por manter a confidencialidade de suas credenciais de acesso (e-mail e senha). Recomendamos fortemente a ativação da autenticação de dois fatores (2FA) quando disponível.
        </p>
        <p>
          Você deve notificar a Prever imediatamente sobre qualquer uso não autorizado de sua Conta ou qualquer outra violação de segurança.
        </p>

        <h4 className="font-semibold">4.4 Suspensão e Encerramento</h4>
        <p>
          A Prever pode suspender ou encerrar sua Conta, a seu exclusivo critério, em caso de:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Violação destes Termos;</li>
          <li>Suspeita de fraude, lavagem de dinheiro ou atividades ilegais;</li>
          <li>Fornecimento de informações falsas;</li>
          <li>Inatividade prolongada;</li>
          <li>Solicitação de autoridades competentes.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'mercados',
    title: '5. Funcionamento dos Mercados',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">5.1 O que são Mercados de Previsão</h4>
        <p>
          A Prever opera mercados de previsão, onde os preços refletem a probabilidade coletiva de um evento acontecer. Os Usuários podem comprar posições SIM (o evento acontecerá) ou NÃO (o evento não acontecerá).
        </p>

        <h4 className="font-semibold">5.2 Como Funcionam os Contratos</h4>
        <p>
          Cada Contrato (ou Ação) vale <strong>R$ 1,00</strong> se a previsão estiver correta quando o Mercado for resolvido, e <strong>R$ 0,00</strong> caso contrário.
        </p>
        <p>
          O preço de um Contrato varia entre R$ 0,01 e R$ 0,99, refletindo a probabilidade percebida pelo mercado. Por exemplo, um Contrato SIM sendo negociado a R$ 0,70 indica que o mercado estima 70% de chance do evento acontecer.
        </p>

        <h4 className="font-semibold">5.3 Order Book</h4>
        <p>
          A Prever utiliza um sistema de Order Book (livro de ofertas) onde:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Ordens de Mercado:</strong> Executadas imediatamente ao melhor preço disponível;</li>
          <li><strong>Ordens Limitadas:</strong> Executadas apenas quando o preço especificado for atingido.</li>
        </ul>

        <h4 className="font-semibold">5.4 Criação de Mercados</h4>
        <p>
          Apenas a Prever pode criar novos Mercados. Cada Mercado possui critérios claros de resolução definidos em sua descrição.
        </p>
      </div>
    )
  },
  {
    id: 'depositos',
    title: '6. Depósitos e Saques',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">6.1 Métodos de Pagamento</h4>
        <p>
          A Prever aceita depósitos e processa saques exclusivamente via PIX, utilizando contas bancárias ou de pagamento de titularidade do próprio Usuário, mantidas em instituições autorizadas pelo Banco Central do Brasil.
        </p>

        <h4 className="font-semibold">6.2 Depósitos</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Valor mínimo de depósito: R$ 10,00;</li>
          <li>Depósitos são processados instantaneamente via PIX;</li>
          <li>Depósitos só podem ser feitos de contas de titularidade do Usuário.</li>
        </ul>

        <h4 className="font-semibold">6.3 Saques</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Valor mínimo de saque: R$ 20,00;</li>
          <li>Saques são processados em até 24 horas úteis;</li>
          <li>Saques só podem ser feitos para contas de titularidade do Usuário;</li>
          <li>A Prever pode solicitar verificação de identidade antes de processar saques.</li>
        </ul>

        <h4 className="font-semibold">6.4 Taxas</h4>
        <p>
          A Prever não cobra taxas sobre depósitos. Taxas de saque, se aplicáveis, serão informadas previamente ao Usuário.
        </p>
      </div>
    )
  },
  {
    id: 'negociacao',
    title: '7. Negociação',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">7.1 Execução de Ordens</h4>
        <p>
          Ao submeter uma ordem, você autoriza a Prever a executá-la de acordo com as condições especificadas. A execução está sujeita à disponibilidade de liquidez no Order Book.
        </p>

        <h4 className="font-semibold">7.2 Cancelamento de Ordens</h4>
        <p>
          Ordens limitadas não executadas podem ser canceladas a qualquer momento. Ordens já executadas (total ou parcialmente) não podem ser revertidas.
        </p>

        <h4 className="font-semibold">7.3 Histórico de Transações</h4>
        <p>
          Todas as transações são registradas e ficam disponíveis para consulta na área "Minhas Apostas" da sua Conta.
        </p>

        <h4 className="font-semibold">7.4 Limites de Negociação</h4>
        <p>
          A Prever pode estabelecer limites de negociação por Usuário, por Mercado ou globais, a seu exclusivo critério, visando a integridade dos mercados.
        </p>
      </div>
    )
  },
  {
    id: 'resolucao',
    title: '8. Resolução de Mercados',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">8.1 Critérios de Resolução</h4>
        <p>
          Cada Mercado possui critérios de resolução claramente definidos em sua descrição. A Prever resolve os Mercados com base em fontes públicas confiáveis, como:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Órgãos governamentais oficiais;</li>
          <li>Agências de notícias reconhecidas;</li>
          <li>Organizações esportivas oficiais;</li>
          <li>Outras fontes especificadas na descrição do Mercado.</li>
        </ul>

        <h4 className="font-semibold">8.2 Prazo de Resolução</h4>
        <p>
          A Prever se esforça para resolver os Mercados o mais rápido possível após o evento. O prazo máximo de resolução é especificado em cada Mercado.
        </p>

        <h4 className="font-semibold">8.3 Pagamento de Ganhos</h4>
        <p>
          Após a resolução, os ganhos são creditados automaticamente no Saldo do Usuário. Cada Contrato vencedor vale R$ 1,00.
        </p>

        <h4 className="font-semibold">8.4 Mercados Anulados</h4>
        <p>
          Em circunstâncias excepcionais, um Mercado pode ser anulado (por exemplo, se o evento for cancelado ou se houver ambiguidade nos critérios). Nesse caso, todas as posições são reembolsadas pelo preço de compra.
        </p>

        <h4 className="font-semibold">8.5 Disputas</h4>
        <p>
          Se você discordar de uma resolução, pode entrar em contato conosco dentro de 7 (sete) dias após a resolução. A decisão final da Prever sobre a resolução é definitiva.
        </p>
      </div>
    )
  },
  {
    id: 'taxas',
    title: '9. Taxas e Custos',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">9.1 Taxas da Plataforma</h4>
        <p>
          A Prever pode cobrar taxas sobre as transações realizadas na Plataforma. As taxas aplicáveis são:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Spread:</strong> Diferença entre preços de compra e venda no Order Book;</li>
          <li><strong>Taxa de execução:</strong> Conforme tabela vigente (se aplicável);</li>
          <li><strong>Taxa de saque:</strong> Conforme informado no momento do saque (se aplicável).</li>
        </ul>

        <h4 className="font-semibold">9.2 Impostos</h4>
        <p>
          <strong>Os Usuários são exclusivamente responsáveis pelo cumprimento de suas obrigações tributárias.</strong> A Prever não fornece aconselhamento tributário. Recomendamos que consulte um profissional de contabilidade para orientação sobre a tributação de ganhos em mercados de previsão.
        </p>
      </div>
    )
  },
  {
    id: 'riscos',
    title: '10. Riscos e Isenções',
    content: (
      <div className="space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
          <p className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2 text-lg">
            <AlertTriangle className="w-6 h-6" />
            AVISO IMPORTANTE DE RISCO
          </p>
        </div>

        <p className="font-semibold">
          NEGOCIAR EM MERCADOS DE PREVISÃO ENVOLVE RISCO SUBSTANCIAL DE PERDA. VOCÊ PODE PERDER TODO O VALOR INVESTIDO.
        </p>

        <h4 className="font-semibold">10.1 Natureza Especulativa</h4>
        <p>
          Mercados de previsão são instrumentos especulativos. Os preços podem ser voláteis e são influenciados por diversos fatores, incluindo notícias, sentimento do mercado e liquidez.
        </p>

        <h4 className="font-semibold">10.2 Não é Aconselhamento</h4>
        <p>
          Nada na Plataforma constitui aconselhamento financeiro, de investimento, jurídico ou tributário. Todas as decisões de negociação são de sua exclusiva responsabilidade.
        </p>

        <h4 className="font-semibold">10.3 Resultados Passados</h4>
        <p>
          Resultados passados não garantem resultados futuros. Mesmo que você tenha obtido ganhos anteriormente, isso não significa que continuará a obter ganhos.
        </p>

        <h4 className="font-semibold">10.4 Capital de Risco</h4>
        <p>
          <strong>Negocie apenas com dinheiro que você pode se dar ao luxo de perder completamente.</strong> Não utilize recursos destinados a despesas essenciais, dívidas ou emergências.
        </p>

        <h4 className="font-semibold">10.5 Isenção de Garantias</h4>
        <p>
          A Plataforma é fornecida "no estado em que se encontra" e "conforme disponível", sem garantias de qualquer tipo, expressas ou implícitas, incluindo, mas não se limitando a, garantias de comercialização, adequação a um propósito específico ou não violação.
        </p>
      </div>
    )
  },
  {
    id: 'conduta',
    title: '11. Conduta do Usuário',
    content: (
      <div className="space-y-4">
        <p>Ao utilizar a Plataforma, você concorda em NÃO:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Manipular mercados ou preços através de ordens falsas, wash trading ou outras práticas enganosas;</li>
          <li>Utilizar informações privilegiadas para negociar;</li>
          <li>Criar múltiplas contas ou utilizar identidades falsas;</li>
          <li>Utilizar a Plataforma para lavagem de dinheiro ou outras atividades ilegais;</li>
          <li>Tentar acessar sistemas ou dados não autorizados;</li>
          <li>Utilizar bots, scripts ou automação não autorizada;</li>
          <li>Interferir no funcionamento normal da Plataforma;</li>
          <li>Assediar, ameaçar ou difamar outros Usuários ou funcionários da Prever;</li>
          <li>Violar direitos de propriedade intelectual;</li>
          <li>Contornar restrições geográficas ou de acesso (como uso de VPN).</li>
        </ul>
        <p className="mt-4">
          Violações podem resultar em suspensão imediata da Conta, perda de saldo e encaminhamento às autoridades competentes.
        </p>
      </div>
    )
  },
  {
    id: 'propriedade',
    title: '12. Propriedade Intelectual',
    content: (
      <div className="space-y-4">
        <p>
          Todo o conteúdo da Plataforma, incluindo mas não se limitando a textos, gráficos, logos, ícones, imagens, clipes de áudio, downloads digitais e compilações de dados, é propriedade da Prever ou de seus licenciadores e está protegido pelas leis de propriedade intelectual brasileiras e internacionais.
        </p>
        <p>
          A Prever concede a você uma licença limitada, não exclusiva, não transferível e revogável para acessar e usar a Plataforma para fins pessoais e não comerciais, sujeita a estes Termos.
        </p>
        <p>
          Você não pode copiar, modificar, distribuir, vender, alugar, licenciar ou criar trabalhos derivados do conteúdo da Plataforma sem autorização expressa por escrito da Prever.
        </p>
      </div>
    )
  },
  {
    id: 'responsabilidade',
    title: '13. Limitação de Responsabilidade',
    content: (
      <div className="space-y-4">
        <p>
          <strong>NA EXTENSÃO MÁXIMA PERMITIDA PELA LEI APLICÁVEL:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>A Prever não será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, dados, uso ou outras perdas intangíveis;</li>
          <li>A responsabilidade total da Prever por quaisquer reclamações decorrentes ou relacionadas a estes Termos ou ao uso da Plataforma será limitada ao valor total depositado por você nos últimos 12 meses;</li>
          <li>A Prever não é responsável por falhas, interrupções ou atrasos causados por terceiros, incluindo provedores de internet, processadores de pagamento ou eventos de força maior;</li>
          <li>A Prever não garante a disponibilidade contínua, ininterrupta ou livre de erros da Plataforma.</li>
        </ul>
        <p className="mt-4">
          Algumas jurisdições não permitem a exclusão ou limitação de certos danos. Nesse caso, as limitações acima podem não se aplicar a você integralmente.
        </p>
      </div>
    )
  },
  {
    id: 'jogo-responsavel',
    title: '14. Jogo Responsável',
    content: (
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compromisso com o Jogo Responsável
          </p>
          <p className="mt-2 text-sm">
            A Prever está comprometida com práticas de jogo responsável e oferece ferramentas para ajudá-lo a manter o controle.
          </p>
        </div>

        <h4 className="font-semibold">14.1 Ferramentas de Controle</h4>
        <p>Disponibilizamos as seguintes ferramentas:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Limites de depósito:</strong> Defina limites diários, semanais ou mensais;</li>
          <li><strong>Histórico completo:</strong> Acesse todo seu histórico de transações;</li>
          <li><strong>Autoexclusão:</strong> Solicite o bloqueio temporário ou permanente de sua Conta.</li>
        </ul>

        <h4 className="font-semibold">14.2 Sinais de Alerta</h4>
        <p>Procure ajuda se você:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Gasta mais tempo ou dinheiro do que pretendia;</li>
          <li>Negligencia responsabilidades pessoais ou profissionais;</li>
          <li>Tenta recuperar perdas com apostas maiores;</li>
          <li>Mente para familiares sobre suas atividades;</li>
          <li>Sente ansiedade ou irritabilidade quando não está negociando.</li>
        </ul>

        <h4 className="font-semibold">14.3 Recursos de Ajuda</h4>
        <p>Se você ou alguém que você conhece está enfrentando problemas:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>CVV (Centro de Valorização da Vida):</strong> Ligue 188 ou acesse cvv.org.br</li>
          <li><strong>Jogadores Anônimos:</strong> www.jogadoresanonimos.org.br</li>
          <li><strong>CAPS (Centro de Atenção Psicossocial):</strong> Procure a unidade mais próxima</li>
        </ul>

        <p className="mt-4 font-semibold">
          Lembre-se: negociar em mercados de previsão deve ser uma atividade de entretenimento, não uma fonte de renda ou solução para problemas financeiros.
        </p>
      </div>
    )
  },
  {
    id: 'privacidade',
    title: '15. Privacidade e Dados',
    content: (
      <div className="space-y-4">
        <p>
          A coleta, uso e proteção de seus dados pessoais são regidos por nossa Política de Privacidade, que é parte integrante destes Termos.
        </p>
        <p>
          A Prever está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais normas aplicáveis.
        </p>
        <p>
          Ao utilizar a Plataforma, você consente com a coleta e uso de seus dados conforme descrito na Política de Privacidade, incluindo para fins de:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Operação e melhoria da Plataforma;</li>
          <li>Prevenção a fraudes e lavagem de dinheiro;</li>
          <li>Cumprimento de obrigações regulatórias;</li>
          <li>Comunicações sobre sua Conta e a Plataforma.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'modificacoes',
    title: '16. Modificações dos Termos',
    content: (
      <div className="space-y-4">
        <p>
          A Prever reserva-se o direito de modificar estes Termos a qualquer momento. Alterações materiais serão comunicadas por:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Publicação na Plataforma com destaque;</li>
          <li>Notificação por e-mail para o endereço cadastrado;</li>
          <li>Aviso no aplicativo (quando aplicável).</li>
        </ul>
        <p>
          As alterações entrarão em vigor na data especificada na notificação ou, na ausência desta, 30 (trinta) dias após a publicação.
        </p>
        <p>
          O uso continuado da Plataforma após a entrada em vigor das alterações constitui sua aceitação dos novos Termos. Se você não concordar com as alterações, deve cessar o uso da Plataforma e solicitar o encerramento de sua Conta.
        </p>
      </div>
    )
  },
  {
    id: 'rescisao',
    title: '17. Rescisão',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">17.1 Rescisão pelo Usuário</h4>
        <p>
          Você pode encerrar sua Conta a qualquer momento através das configurações da Conta ou entrando em contato conosco. Antes do encerramento, você deve:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Cancelar todas as ordens abertas;</li>
          <li>Sacar o saldo disponível;</li>
          <li>Aguardar a resolução de Mercados em que possui posições.</li>
        </ul>

        <h4 className="font-semibold">17.2 Rescisão pela Prever</h4>
        <p>
          A Prever pode suspender ou encerrar sua Conta imediatamente, sem aviso prévio, em caso de violação destes Termos ou por outros motivos justificados.
        </p>

        <h4 className="font-semibold">17.3 Efeitos da Rescisão</h4>
        <p>
          Após o encerramento da Conta:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Seu acesso à Plataforma será revogado;</li>
          <li>Posições abertas poderão ser liquidadas ao preço de mercado;</li>
          <li>Saldo remanescente será disponibilizado para saque, deduzidas eventuais taxas ou penalidades;</li>
          <li>Certas disposições destes Termos sobreviverão à rescisão.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'lei-aplicavel',
    title: '18. Lei Aplicável e Foro',
    content: (
      <div className="space-y-4">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="font-semibold flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Jurisdição Brasileira
          </p>
        </div>

        <p>
          Estes Termos são regidos e interpretados de acordo com as leis da República Federativa do Brasil.
        </p>
        <p>
          Fica eleito o foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias decorrentes destes Termos, com exclusão de qualquer outro, por mais privilegiado que seja.
        </p>
        <p>
          Sem prejuízo do acima, reconhecemos os direitos previstos no Código de Defesa do Consumidor (Lei nº 8.078/1990), incluindo o direito do consumidor de ajuizar ação no foro de seu domicílio.
        </p>
        <p>
          Antes de recorrer ao Judiciário, encorajamos a resolução de disputas através de nossos canais de atendimento ao cliente.
        </p>
      </div>
    )
  },
  {
    id: 'disposicoes-gerais',
    title: '19. Disposições Gerais',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">19.1 Acordo Integral</h4>
        <p>
          Estes Termos, juntamente com a Política de Privacidade, constituem o acordo integral entre você e a Prever relativamente ao uso da Plataforma.
        </p>

        <h4 className="font-semibold">19.2 Divisibilidade</h4>
        <p>
          Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor e efeito.
        </p>

        <h4 className="font-semibold">19.3 Renúncia</h4>
        <p>
          A falha da Prever em exercer ou executar qualquer direito ou disposição destes Termos não constituirá renúncia a tal direito ou disposição.
        </p>

        <h4 className="font-semibold">19.4 Cessão</h4>
        <p>
          Você não pode ceder ou transferir seus direitos ou obrigações sob estes Termos sem o consentimento prévio por escrito da Prever. A Prever pode ceder livremente seus direitos e obrigações.
        </p>

        <h4 className="font-semibold">19.5 Comunicações</h4>
        <p>
          Comunicações da Prever para você serão feitas por e-mail para o endereço cadastrado ou por avisos na Plataforma.
        </p>

        <h4 className="font-semibold">19.6 Idioma</h4>
        <p>
          Estes Termos foram redigidos em português brasileiro. Em caso de tradução para outros idiomas, a versão em português prevalecerá em caso de conflito.
        </p>
      </div>
    )
  },
  {
    id: 'contato',
    title: '20. Contato',
    content: (
      <div className="space-y-4">
        <p>
          Se você tiver dúvidas sobre estes Termos e Condições, entre em contato conosco:
        </p>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <strong>E-mail:</strong> suporte@prever.com.br
          </p>
          <p className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <strong>Site:</strong> www.prever.com.br
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Nosso horário de atendimento é de segunda a sexta-feira, das 9h às 18h (horário de Brasília), exceto feriados nacionais.
        </p>
      </div>
    )
  }
]

export default function TermosPage() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedSections(new Set(sections.map(s => s.id)))
  }

  const collapseAll = () => {
    setExpandedSections(new Set())
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setExpandedSections(prev => new Set(prev).add(id))
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Navigation */}
      <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Termos e Condições de Uso
            </h1>
            <p className="text-muted-foreground mt-2">
              Leia atentamente antes de utilizar a plataforma Prever
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              Atualizado: {LAST_UPDATED}
            </Badge>
            <Badge variant="secondary">v{VERSION}</Badge>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Table of Contents - Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-sm">Índice</h3>
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="block w-full text-left text-xs text-muted-foreground hover:text-foreground py-1 px-2 rounded hover:bg-muted/50 transition-colors truncate"
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={expandAll} className="flex-1 text-xs">
                  Expandir
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll} className="flex-1 text-xs">
                  Recolher
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Important Notice */}
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>Importante:</strong> Ao criar uma conta ou utilizar a plataforma Prever, você declara ter lido, compreendido e concordado integralmente com estes Termos e Condições. Recomendamos que você leia este documento com atenção.
              </p>
            </CardContent>
          </Card>

          {/* Sections */}
          {sections.map((section) => (
            <Collapsible
              key={section.id}
              open={expandedSections.has(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <Card id={section.id} className="border-border/50 scroll-mt-24">
                <CardContent className="p-0">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                      <h2 className="font-semibold text-lg">{section.title}</h2>
                      {expandedSections.has(section.id) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 prose prose-sm dark:prose-invert max-w-none">
                      {section.content}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))}

          {/* Footer */}
          <Card className="border-border/50 bg-muted/30">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              <p>
                Documento atualizado em {LAST_UPDATED} - Versão {VERSION}
              </p>
              <p className="mt-2">
                Prever - Mercado de Previsões
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-6 right-6 rounded-full shadow-lg z-50"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}
