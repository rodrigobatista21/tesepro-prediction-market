'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Plus, Copy, Check, Loader2, Smartphone } from 'lucide-react'
import { formatBRL } from '@/lib/utils/format'
import { useTrade } from '@/lib/hooks/use-trade'

interface DepositModalProps {
  userId: string
  onSuccess?: () => void
  children?: React.ReactNode
}

const QUICK_DEPOSITS = [50, 100, 200, 500]

export function DepositModal({ userId, onSuccess, children }: DepositModalProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>('')
  const [step, setStep] = useState<'amount' | 'pix' | 'success'>('amount')
  const [copied, setCopied] = useState(false)
  const { depositMock, isLoading, error } = useTrade()

  const amountNumber = parseFloat(amount) || 0

  // Simula código PIX
  const pixCode = `00020126580014br.gov.bcb.pix0136${userId.slice(0, 8)}-prever520400005303986540${amountNumber.toFixed(2)}5802BR5913PREVER MARKET6009SAO PAULO62070503***6304`

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^\d,\.]/g, '').replace(',', '.')
    setAmount(cleaned)
  }

  const handleQuickDeposit = (value: number) => {
    setAmount(value.toString())
  }

  const handleGeneratePix = () => {
    if (amountNumber >= 10) {
      setStep('pix')
    }
  }

  const handleCopyPix = async () => {
    await navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // DEV ONLY: Simular depósito
  const handleSimulateDeposit = async () => {
    const result = await depositMock(userId, amountNumber)
    if (result?.success) {
      setStep('success')
      onSuccess?.()
      setTimeout(() => {
        setOpen(false)
        setStep('amount')
        setAmount('')
      }, 2000)
    }
  }

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setStep('amount')
      setAmount('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Depositar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === 'amount' && (
          <>
            <DialogHeader>
              <DialogTitle>Depositar via PIX</DialogTitle>
              <DialogDescription>
                Depósito instantâneo. Sem taxas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Input de valor */}
              <div className="space-y-2">
                <Label>Valor do depósito</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pl-10 h-14 text-xl font-semibold"
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {QUICK_DEPOSITS.map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    onClick={() => handleQuickDeposit(value)}
                  >
                    {formatBRL(value)}
                  </Button>
                ))}
              </div>

              {/* Limites */}
              <p className="text-sm text-muted-foreground text-center">
                Mínimo: R$ 10,00 • Máximo: R$ 10.000,00
              </p>

              <Button
                onClick={handleGeneratePix}
                disabled={amountNumber < 10 || amountNumber > 10000}
                className="w-full h-12"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Gerar código PIX
              </Button>
            </div>
          </>
        )}

        {step === 'pix' && (
          <>
            <DialogHeader>
              <DialogTitle>Pague com PIX</DialogTitle>
              <DialogDescription>
                Copie o código e pague no app do seu banco
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Valor */}
              <div className="text-center py-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Valor a pagar</p>
                <p className="text-3xl font-bold">{formatBRL(amountNumber)}</p>
              </div>

              {/* Código PIX */}
              <div className="space-y-2">
                <Label>Código PIX Copia e Cola</Label>
                <div className="relative">
                  <Input
                    value={pixCode}
                    readOnly
                    className="pr-20 font-mono text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={handleCopyPix}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-emerald-500" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* DEV: Simular depósito */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  🧪 Ambiente de desenvolvimento
                </p>
                <Button
                  onClick={handleSimulateDeposit}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 border-dashed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Simular pagamento do PIX'
                  )}
                </Button>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Depósito confirmado!</h3>
              <p className="text-muted-foreground">
                {formatBRL(amountNumber)} adicionado ao seu saldo
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
