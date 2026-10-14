import * as React from 'react';
import { cn } from 'cn';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-lg border border-line bg-canvas px-2.5 py-2 text-base transition-colors outline-none placeholder:text-ink-faint disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-50 aria-invalid:border-danger md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
