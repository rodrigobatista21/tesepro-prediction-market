'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, HelpCircle, Search, ChevronDown, ChevronUp, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from '@/lib/utils'

interface FAQ {
  question: string
  answer: string
  category: string
}

const faqs: FAQ[] = [
  // Geral
  {
    category: 'Geral',
    question: 'O que e a Prever?',
    answer: 'A Prever e uma plataforma de mercados de previsao onde voce pode negociar contratos baseados em eventos futuros. O preco de cada contrato reflete a probabilidade coletiva de um evento acontecer.'
  },
  {
    category: 'Geral',
    question: 'Como funcionam os mercados de previsao?',
    answer: 'Em cada mercado, voce pode comprar contratos SIM (o evento vai acontecer) ou NAO (o evento nao vai acontecer). Se sua previsao estiver correta, cada contrato vale R$ 1,00. Se estiver errada, vale R$ 0,00. O preco que voce paga reflete a probabilidade estimada pelo mercado.'
  },
  {
    category: 'Geral',
    question: 'E legal participar de mercados de previsao no Brasil?',
    answer: 'Mercados de previsao operam em uma area regulatoria em evolucao no Brasil. A Lei 14.790/2023 estabeleceu o marco regulatorio para apostas de quota fixa. Recomendamos que consulte um profissional juridico para orientacao especifica.'
  },
  // Conta
  {
    category: 'Conta',
    question: 'Como crio uma conta?',
    answer: 'Clique em "Criar Conta" na pagina inicial, preencha seus dados (nome, e-mail, senha) e confirme seu e-mail. O processo leva menos de 2 minutos.'
  },
  {
    category: 'Conta',
    question: 'Preciso verificar minha identidade?',
    answer: 'Para depositos e saques, podemos solicitar verificacao de identidade (KYC) para cumprir regulamentacoes anti-lavagem de dinheiro. Isso inclui documento de identidade e comprovante de residencia.'
  },
  {
    category: 'Conta',
    question: 'Posso ter mais de uma conta?',
    answer: 'Nao. Cada pessoa pode ter apenas uma conta na Prever. Contas duplicadas serao encerradas e os saldos podem ser confiscados.'
  },
  // Depositos e Saques
  {
    category: 'Depositos e Saques',
    question: 'Quais metodos de pagamento sao aceitos?',
    answer: 'Atualmente aceitamos apenas PIX para depositos e saques. Isso garante transferencias instantaneas e seguras atraves do sistema do Banco Central.'
  },
  {
    category: 'Depositos e Saques',
    question: 'Qual o valor minimo para deposito?',
    answer: 'O valor minimo para deposito e R$ 10,00. Nao ha limite maximo, mas depositos acima de R$ 50.000 podem requerer verificacao adicional.'
  },
  {
    category: 'Depositos e Saques',
    question: 'Quanto tempo demora um saque?',
    answer: 'Saques via PIX sao processados em ate 24 horas uteis. A maioria dos saques e processada em poucos minutos durante o horario comercial.'
  },
  {
    category: 'Depositos e Saques',
    question: 'Ha taxas para deposito ou saque?',
    answer: 'Nao cobramos taxas sobre depositos. Saques podem ter uma pequena taxa, que sera informada antes da confirmacao.'
  },
  // Negociacao
  {
    category: 'Negociacao',
    question: 'Qual a diferenca entre ordem de mercado e ordem limite?',
    answer: 'Ordem de mercado: Executada imediatamente ao melhor preco disponivel. Ordem limite: Voce define o preco maximo que aceita pagar, e a ordem so executa se houver vendedor nesse preco ou melhor.'
  },
  {
    category: 'Negociacao',
    question: 'O que significa o preco de um contrato?',
    answer: 'O preco representa a probabilidade estimada pelo mercado. Um contrato SIM a R$ 0,70 significa que o mercado estima 70% de chance do evento acontecer. Se acontecer, voce recebe R$ 1,00 (lucro de R$ 0,30 por contrato).'
  },
  {
    category: 'Negociacao',
    question: 'Posso vender meus contratos antes do mercado fechar?',
    answer: 'Sim! Voce pode vender seus contratos a qualquer momento antes da resolucao do mercado. O preco de venda dependera da oferta e demanda no momento.'
  },
  {
    category: 'Negociacao',
    question: 'O que acontece se nao houver liquidez?',
    answer: 'Se nao houver ordens de venda disponiveis, voce pode colocar uma ordem limite ao preco desejado. Sua ordem ficara no livro de ofertas ate ser executada ou cancelada.'
  },
  // Resolucao
  {
    category: 'Resolucao',
    question: 'Como os mercados sao resolvidos?',
    answer: 'Cada mercado tem criterios de resolucao claros descritos em sua pagina. Usamos fontes oficiais e confiaveis (orgaos governamentais, agencias de noticias, etc.) para determinar o resultado.'
  },
  {
    category: 'Resolucao',
    question: 'Quando recebo meus ganhos?',
    answer: 'Apos a resolucao do mercado, os ganhos sao creditados automaticamente no seu saldo. Cada contrato vencedor vale R$ 1,00.'
  },
  {
    category: 'Resolucao',
    question: 'E se eu discordar da resolucao?',
    answer: 'Voce pode contestar uma resolucao dentro de 7 dias, entrando em contato com nosso suporte. Analisaremos sua contestacao com base nos criterios do mercado.'
  },
  // Seguranca
  {
    category: 'Seguranca',
    question: 'Meus dados estao seguros?',
    answer: 'Sim. Usamos criptografia de ponta (TLS 1.3), armazenamento seguro e autenticacao de dois fatores. Estamos em conformidade com a LGPD.'
  },
  {
    category: 'Seguranca',
    question: 'O que e autenticacao de dois fatores (2FA)?',
    answer: 'E uma camada extra de seguranca que requer um codigo temporario (alem da senha) para acessar sua conta. Recomendamos fortemente que ative o 2FA nas configuracoes.'
  },
]

const categories = ['Todos', ...Array.from(new Set(faqs.map(f => f.category)))]

export default function FAQPage() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation */}
      <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary" />
          Perguntas Frequentes
        </h1>
        <p className="text-muted-foreground">
          Encontre respostas para as duvidas mais comuns
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar pergunta..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="rounded-full"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma pergunta encontrada para sua busca.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFaqs.map((faq, index) => (
            <Collapsible
              key={index}
              open={expandedQuestions.has(index)}
              onOpenChange={() => toggleQuestion(index)}
            >
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-start justify-between p-4 hover:bg-muted/50 transition-colors text-left gap-4">
                      <div className="flex-1">
                        <span className="text-xs text-primary font-medium">{faq.category}</span>
                        <h3 className="font-semibold mt-1">{faq.question}</h3>
                      </div>
                      {expandedQuestions.has(index) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border/50 pt-4">
                      {faq.answer}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>

      {/* Still have questions */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Mail className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <h2 className="font-bold">Ainda tem duvidas?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Nossa equipe de suporte esta pronta para ajudar.
              </p>
              <p className="text-primary font-medium mt-2">
                suporte@tesepro.com.br
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Respondemos em ate 24 horas uteis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
