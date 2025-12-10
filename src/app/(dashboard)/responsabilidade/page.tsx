'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, Shield, AlertTriangle, Heart, Phone, HelpCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function ResponsabilidadePage() {
  const [showScrollTop, setShowScrollTop] = useState(false)

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
          <Shield className="w-8 h-8 text-primary" />
          Jogo Responsavel
        </h1>
        <p className="text-muted-foreground">
          Nosso compromisso com praticas saudaveis de negociacao
        </p>
      </div>

      {/* Warning Card */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-lg text-amber-600 dark:text-amber-400">
                Aviso Importante
              </h2>
              <p className="mt-2 text-sm">
                Negociar em mercados de previsao envolve risco financeiro. Negocie apenas com dinheiro que voce pode perder.
                Se voce sente que esta perdendo o controle, procure ajuda.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Principles */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Nossos Principios
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Negociar deve ser uma atividade de entretenimento, nao uma fonte de renda</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Nunca negocie com dinheiro que voce precisa para despesas essenciais</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Defina limites antes de comecar e respeite-os</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>Nao tente recuperar perdas aumentando suas apostas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">5.</span>
                <span>Faca pausas regulares e mantenha outras atividades em sua vida</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Warning Signs */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Sinais de Alerta
            </h2>
            <p className="text-sm text-muted-foreground">
              Procure ajuda se voce identificar estes comportamentos:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Gasta mais tempo ou dinheiro do que pretendia
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Negligencia responsabilidades pessoais ou profissionais
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Tenta recuperar perdas com apostas maiores
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Mente para familiares sobre suas atividades
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Sente ansiedade quando nao esta negociando
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Pede dinheiro emprestado para negociar
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Tools */}
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Ferramentas de Protecao
          </h2>
          <p className="text-sm text-muted-foreground">
            Oferecemos ferramentas para ajuda-lo a manter o controle:
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-sm">Limites de Deposito</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Defina limites diarios, semanais ou mensais para seus depositos
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-sm">Historico Completo</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Acesse todo seu historico de transacoes para acompanhar seus gastos
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-sm">Autoexclusao</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Solicite o bloqueio temporario ou permanente da sua conta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Resources */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Precisa de Ajuda?
          </h2>
          <p className="text-sm">
            Se voce ou alguem que voce conhece esta enfrentando problemas com jogo,
            entre em contato com os seguintes recursos de apoio:
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-background rounded-lg p-4 border border-border/50">
              <h3 className="font-semibold">CVV</h3>
              <p className="text-sm text-muted-foreground">Centro de Valorizacao da Vida</p>
              <p className="text-primary font-bold mt-2">Ligue 188</p>
              <p className="text-xs text-muted-foreground">24 horas, todos os dias</p>
            </div>
            <div className="bg-background rounded-lg p-4 border border-border/50">
              <h3 className="font-semibold">Jogadores Anonimos</h3>
              <p className="text-sm text-muted-foreground">Grupos de apoio</p>
              <a
                href="https://www.jogadoresanonimos.org.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold mt-2 block hover:underline"
              >
                jogadoresanonimos.org.br
              </a>
            </div>
            <div className="bg-background rounded-lg p-4 border border-border/50">
              <h3 className="font-semibold">CAPS</h3>
              <p className="text-sm text-muted-foreground">Centro de Atencao Psicossocial</p>
              <p className="text-xs text-muted-foreground mt-2">
                Procure a unidade mais proxima de voce
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <HelpCircle className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <h2 className="font-bold">Fale Conosco</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Se voce precisa de ajuda para configurar limites ou solicitar autoexclusao,
                entre em contato com nosso suporte:
              </p>
              <p className="text-primary font-medium mt-2">
                suporte@tesepro.com.br
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
