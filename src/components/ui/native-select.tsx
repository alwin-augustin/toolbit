import * as React from 'react';
import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default';
};

/**
 * A `<select>` for short option lists, where the platform's own menu is faster
 * and more accessible than a custom popup.
 *
 * Sizing, fill, hairline and ink come from `.wb-select`, the same primitive the
 * command palette's select uses, so this control is indistinguishable from the
 * outline button beside it in a toolbar row. `data-size` picks the height from
 * the control scale: `sm` (28px) inside a toolbar, `default` (32px) alone.
 */
function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
  return (
    <div
      className={cn(
        'group/native-select relative w-fit has-[select:disabled]:opacity-50',
        className,
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="wb-select w-full min-w-0 appearance-none py-1 pr-8 pl-2.5 select-none aria-invalid:border-danger"
        {...props}
      />
      <ChevronDownIcon
        className="wb-select-caret absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

/* Option and optgroup keep the platform's own colours: they render in the OS
   menu, outside our token context, so overriding them makes them unreadable. */
function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
  return (
    <option
      data-slot="native-select-option"
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<'optgroup'>) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
