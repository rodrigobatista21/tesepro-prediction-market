'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  endsAt: string
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer({ endsAt, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date(endsAt).getTime()
      const now = Date.now()
      const difference = endDate - now

      if (difference <= 0) {
        setIsExpired(true)
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endsAt])

  if (isExpired) {
    return (
      <div className={cn('text-center', className)}>
        <p className="text-sm text-muted-foreground mb-2">O mercado encerrou</p>
        <div className="flex items-center justify-center gap-2">
          <TimeBlock value={0} label="DIAS" />
          <Separator />
          <TimeBlock value={0} label="HRS" />
          <Separator />
          <TimeBlock value={0} label="MIN" />
          <Separator />
          <TimeBlock value={0} label="SEG" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('text-center', className)}>
      <p className="text-sm text-muted-foreground mb-3">O mercado fechará em</p>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <TimeBlock value={timeLeft.days} label="DIAS" />
        <Separator />
        <TimeBlock value={timeLeft.hours} label="HRS" />
        <Separator />
        <TimeBlock value={timeLeft.minutes} label="MIN" />
        <Separator />
        <TimeBlock value={timeLeft.seconds} label="SEG" />
      </div>
    </div>
  )
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 min-w-[50px] sm:min-w-[60px]">
        <span className="text-xl sm:text-2xl font-bold tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">
        {label}
      </span>
    </div>
  )
}

function Separator() {
  return (
    <span className="text-xl sm:text-2xl font-bold text-muted-foreground/50 -mt-5">:</span>
  )
}
