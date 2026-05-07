import React from 'react'

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
  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function FormInput({ className, ...props }: InputProps) {
  return <input className={`${inputClass} ${className ?? ''}`} {...props} />
}

export function FormSelect({ className, children, ...props }: SelectProps) {
  return (
    <select className={`${inputClass} ${className ?? ''}`} {...props}>
      {children}
    </select>
  )
}

export function FormTextarea({ className, ...props }: TextareaProps) {
  return <textarea className={`${inputClass} resize-none ${className ?? ''}`} {...props} />
}
