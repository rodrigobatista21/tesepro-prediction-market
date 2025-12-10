'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, Lock, Shield, Eye, Database, UserCheck, Mail, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const LAST_UPDATED = '10 de dezembro de 2024'

export default function PrivacidadePage() {
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
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Lock className="w-8 h-8 text-primary" />
              Politica de Privacidade
            </h1>
            <p className="text-muted-foreground mt-2">
              Como coletamos, usamos e protegemos seus dados
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Calendar className="w-3 h-3" />
            Atualizado: {LAST_UPDATED}
          </Badge>
        </div>
      </div>

      {/* LGPD Notice */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <p className="text-sm">
              <strong>Conformidade LGPD:</strong> Esta politica esta em conformidade com a
              Lei Geral de Protecao de Dados (Lei n 13.709/2018).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              1. Dados que Coletamos
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold">Dados de Cadastro</h3>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Nome completo</li>
                  <li>E-mail</li>
                  <li>CPF (para verificacao de identidade)</li>
                  <li>Data de nascimento</li>
                  <li>Telefone (opcional)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Dados de Uso</h3>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Historico de transacoes e negociacoes</li>
                  <li>Endereço IP e informacoes do dispositivo</li>
                  <li>Paginas visitadas e tempo de navegacao</li>
                  <li>Preferencias e configuracoes da conta</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Dados Financeiros</h3>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Chave PIX para depositos e saques</li>
                  <li>Historico de depositos e saques</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2 */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              2. Como Usamos seus Dados
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">1</span>
                <div>
                  <span className="font-semibold">Operacao da Plataforma</span>
                  <p className="text-muted-foreground">Processar transacoes, executar ordens e manter sua conta</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">2</span>
                <div>
                  <span className="font-semibold">Seguranca e Prevencao a Fraudes</span>
                  <p className="text-muted-foreground">Detectar atividades suspeitas e proteger sua conta</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">3</span>
                <div>
                  <span className="font-semibold">Conformidade Regulatoria</span>
                  <p className="text-muted-foreground">Cumprir obrigacoes legais e regulatorias</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">4</span>
                <div>
                  <span className="font-semibold">Comunicacao</span>
                  <p className="text-muted-foreground">Enviar notificacoes sobre sua conta e atualizacoes importantes</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">5</span>
                <div>
                  <span className="font-semibold">Melhoria dos Servicos</span>
                  <p className="text-muted-foreground">Analisar uso para melhorar a experiencia do usuario</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 3 */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              3. Como Protegemos seus Dados
            </h2>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold">Criptografia</h3>
                <p className="text-muted-foreground mt-1">
                  Todos os dados sao transmitidos via HTTPS com criptografia TLS 1.3
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold">Armazenamento Seguro</h3>
                <p className="text-muted-foreground mt-1">
                  Dados armazenados em servidores seguros com acesso restrito
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold">Autenticacao</h3>
                <p className="text-muted-foreground mt-1">
                  Suporte a autenticacao de dois fatores (2FA) para maior seguranca
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold">Monitoramento</h3>
                <p className="text-muted-foreground mt-1">
                  Sistemas de deteccao de intrusao e monitoramento 24/7
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4 */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              4. Seus Direitos (LGPD)
            </h2>
            <p className="text-sm text-muted-foreground">
              De acordo com a LGPD, voce tem os seguintes direitos:
            </p>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="text-primary font-bold">Acesso</span>
                <span className="text-muted-foreground">Solicitar copia dos seus dados pessoais</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="text-primary font-bold">Correcao</span>
                <span className="text-muted-foreground">Corrigir dados incompletos ou desatualizados</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="text-primary font-bold">Exclusao</span>
                <span className="text-muted-foreground">Solicitar exclusao dos seus dados (com excecoes legais)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="text-primary font-bold">Portabilidade</span>
                <span className="text-muted-foreground">Receber seus dados em formato estruturado</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="text-primary font-bold">Revogacao</span>
                <span className="text-muted-foreground">Revogar consentimento a qualquer momento</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5 */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg">5. Compartilhamento de Dados</h2>
            <p className="text-sm text-muted-foreground">
              Seus dados podem ser compartilhados apenas nas seguintes situacoes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <strong>Processadores de Pagamento:</strong> Para processar depositos e saques via PIX
              </li>
              <li>
                <strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial
              </li>
              <li>
                <strong>Prevencao a Fraudes:</strong> Com servicos de verificacao de identidade
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Nunca vendemos seus dados pessoais para terceiros.</strong>
            </p>
          </CardContent>
        </Card>

        {/* Section 6 */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg">6. Cookies e Tecnologias Similares</h2>
            <p className="text-sm text-muted-foreground">
              Utilizamos cookies para:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Manter sua sessao ativa</li>
              <li>Lembrar suas preferencias</li>
              <li>Analisar o uso da plataforma</li>
              <li>Melhorar a seguranca</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Voce pode gerenciar cookies nas configuracoes do seu navegador.
            </p>
          </CardContent>
        </Card>

        {/* Section 7 */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg">7. Retencao de Dados</h2>
            <p className="text-sm text-muted-foreground">
              Mantemos seus dados pelo tempo necessario para:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Fornecer nossos servicos enquanto sua conta estiver ativa</li>
              <li>Cumprir obrigacoes legais (ate 5 anos apos encerramento)</li>
              <li>Resolver disputas e fazer cumprir nossos acordos</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <h2 className="font-bold">Encarregado de Dados (DPO)</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Para exercer seus direitos ou esclarecer duvidas sobre esta politica:
                </p>
                <p className="text-primary font-medium mt-2">
                  privacidade@tesepro.com.br
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
