import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

// forwardRef is necessary here specifically because React Hook Form's
// register() needs a real ref to the underlying <input> DOM node to read
// its value uncontrolled -- without forwardRef, react-hook-form couldn't
// wire itself up to this component at all.
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...rest },
  ref,
) {
  // Falls back to a generated id from the label so <label htmlFor> always
  // has something valid to point at, even if the caller forgets to pass
  // one -- keeps every field screen-reader-accessible by default.
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`rounded-md border px-3 py-2 text-sm outline-none transition-colors
          focus:border-amber focus:ring-1 focus:ring-amber
          ${error ? 'border-danger' : 'border-border'} ${className}`}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
