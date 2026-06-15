import React, { useId } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

const inputClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-[#f1f5f9] dark:border-[#334155] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-bold text-[#0f172a] dark:text-white'

/** Wrapper untuk label + input dengan styling konsisten */
export function FormField({ label, required, children, className }: FormFieldProps) {
  const fieldId = useId()
  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <label htmlFor={fieldId} className="text-[11px] font-bold text-gray-500 uppercase tracking-widest pl-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id: fieldId })
        : children}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function FormInput({ className, id, ...props }: InputProps) {
  return <input id={id} className={`${inputClass} ${className ?? ''}`} {...props} />
}

export function FormSelect({ className, id, children, ...props }: SelectProps) {
  return (
    <select id={id} className={`${inputClass} ${className ?? ''}`} {...props}>
      {children}
    </select>
  )
}

export function FormTextarea({ className, id, ...props }: TextareaProps) {
  return <textarea id={id} className={`${inputClass} resize-none ${className ?? ''}`} {...props} />
}
