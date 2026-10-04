import * as React from 'react';
import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  'value' | 'defaultValue' | 'onValueChange'
> {
  value?: number | number[];
  defaultValue?: number | number[];
  onValueChange?: (value: number | number[]) => void;
}

function Slider({
  className,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  ...props
}: SliderProps) {
  // Normalize value to array if single number is provided
  const normalizedValue = React.useMemo(() => {
    if (value === undefined) return undefined;
    return typeof value === 'number' ? [value] : value;
  }, [value]);

  const normalizedDefaultValue = React.useMemo(() => {
    if (defaultValue === undefined) return undefined;
    return typeof defaultValue === 'number' ? [defaultValue] : defaultValue;
  }, [defaultValue]);

  const handleValueChange = React.useCallback(
    (val: number | number[]) => {
      if (!onValueChange) return;
      if (Array.isArray(val) && typeof value === 'number') {
        onValueChange(val[0] ?? min);
      } else {
        onValueChange(val);
      }
    },
    [onValueChange, value, min],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={normalizedValue}
      defaultValue={normalizedDefaultValue}
      onValueChange={handleValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(
        'relative flex w-full touch-none select-none items-center py-2 data-disabled:opacity-50 data-disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full items-center">
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-input/80 dark:bg-input/40">
          <SliderPrimitive.Indicator className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={props['aria-label']}
          className="block size-4 rounded-full border border-primary/50 bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none cursor-grab active:cursor-grabbing hover:bg-muted"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
