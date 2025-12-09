'use client'

import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MarketSearchProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function MarketSearch({
  value,
  onChange,
  className,
  placeholder = 'Buscar mercados...'
}: MarketSearchProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  return (
    <div
      className={cn(
        'relative flex items-center',
        className
      )}
    >
      <Search
        className={cn(
          'absolute left-3 w-4 h-4 transition-colors',
          isFocused ? 'text-primary' : 'text-muted-foreground'
        )}
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          'pl-10 pr-10 h-11 bg-muted/50 border-border/50',
          'focus:bg-background focus:border-primary/50',
          'transition-all duration-200'
        )}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Limpar busca</span>
        </Button>
      )}
    </div>
  )
}
