import * as React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinInputProps extends Omit<React.ComponentProps<'input'>, 'type' | 'onChange'> {
  value: number | string
  onChange: (value: string) => void
  step?: number
  min?: number
  max?: number
}

function SpinInput({
  className,
  value,
  onChange,
  step = 1,
  min,
  max,
  ...props
}: SpinInputProps) {
  const handleIncrement = () => {
    const current = typeof value === 'string' ? parseFloat(value) || 0 : value
    const newValue = current + step
    if (max === undefined || newValue <= max) {
      onChange(String(Number(newValue.toFixed(10))))
    }
  }

  const handleDecrement = () => {
    const current = typeof value === 'string' ? parseFloat(value) || 0 : value
    const newValue = current - step
    if (min === undefined || newValue >= min) {
      onChange(String(Number(newValue.toFixed(10))))
    }
  }

  return (
    <div className="relative flex items-center">
      <input
        type="number"
        data-slot="input"
        value={value === 0 ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-8 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          className
        )}
        {...props}
      />
      <div className="absolute right-1 flex flex-col">
        <button
          type="button"
          onClick={handleIncrement}
          className="flex h-4 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          tabIndex={-1}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          className="flex h-4 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          tabIndex={-1}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export { SpinInput }
