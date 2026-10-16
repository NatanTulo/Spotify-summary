import { Children, Fragment, isValidElement, type ButtonHTMLAttributes, type ReactNode } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SelectProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange' | 'children' | 'defaultValue'> {
    value: string | number
    onValueChange: (value: string) => void
    children: ReactNode
    name?: string
    required?: boolean
}
interface Option { value: string; label: ReactNode; disabled: boolean; text: string }
function textContent(node: ReactNode): string {
    return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child) ? textContent(child.props.children) : String(child)).join('')
}
function getOptions(children: ReactNode): Option[] {
    return Children.toArray(children).flatMap(child => {
        if (!isValidElement<{ children?: ReactNode; value?: string | number; disabled?: boolean }>(child)) return []
        if (child.type === Fragment) return getOptions(child.props.children)
        if (child.type !== 'option') return []
        const text = textContent(child.props.children)
        return [{ value: String(child.props.value ?? text), label: child.props.children, disabled: Boolean(child.props.disabled), text }]
    })
}

/** Native-like option children, with a themed, keyboard-accessible Radix popup. */
export function Select({ value, onValueChange, children, className, disabled, name, required, ...props }: SelectProps) {
    const options = getOptions(children)
    const selected = options.find(option => option.value === String(value))
    // Prefix every value so the empty "all" option is a valid Radix item too.
    return <SelectPrimitive.Root value={`v:${value}`} onValueChange={next => onValueChange(next.slice(2))} disabled={disabled} name={name} required={required}>
        <SelectPrimitive.Trigger {...props} className={cn('inline-flex min-h-10 max-w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50 [&>span:first-child]:truncate', className)}>
            <SelectPrimitive.Value>{selected?.label ?? String(value)}</SelectPrimitive.Value>
            <SelectPrimitive.Icon asChild><ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" /></SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content position="popper" sideOffset={6} collisionPadding={12} className="z-[100] max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center bg-popover"><ChevronUp className="h-4 w-4" /></SelectPrimitive.ScrollUpButton>
                <SelectPrimitive.Viewport className="p-1">
                    {options.map(option => <SelectPrimitive.Item key={option.value} value={`v:${option.value}`} disabled={option.disabled} textValue={option.text} className="relative flex min-h-10 cursor-default select-none items-center rounded-md py-2 pr-9 pl-3 text-sm outline-none data-[state=checked]:font-medium data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40">
                        <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                        <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex items-center text-primary"><Check className="h-4 w-4" /></SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>)}
                </SelectPrimitive.Viewport>
                <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center bg-popover"><ChevronDown className="h-4 w-4" /></SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
}
