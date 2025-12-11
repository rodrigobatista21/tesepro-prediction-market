'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-5 text-muted-foreground">
          {icon}
        </div>

        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        <p className="text-muted-foreground mb-6 max-w-sm text-sm leading-relaxed">
          {description}
        </p>

        {actionLabel && actionHref && (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
