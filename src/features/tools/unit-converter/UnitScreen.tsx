import { useState } from 'react';
import convert, { type Measure, type Unit } from 'convert-units';
import { IconCircleCheckFilled, IconCopy, IconDeviceDesktop, IconEqual } from '@tabler/icons-react';
import { useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Thin wrapper over convert-units so unit math stays unit-testable. */
export function convertUnitValue(value: number, from: Unit, to: Unit): number {
  return convert(value).from(from).to(to);
}

export function listMeasures(): Measure[] {
  return convert().measures();
}

export function listUnits(measure: Measure): { abbr: Unit; label: string }[] {
  return convert()
    .list(measure)
    .map((u) => ({ abbr: u.abbr, label: `${u.singular} (${u.abbr})` }));
}

export function UnitScreen() {
  const measures = listMeasures();
  const [measure, setMeasure] = useSessionDocumentState<Measure>('measure', measures[0]);
  const units = listUnits(measure);
  const [fromUnit, setFromUnit] = useSessionDocumentState<Unit>(
    'fromUnit',
    units[0]?.abbr ?? ('m' as Unit),
  );
  const [toUnit, setToUnit] = useSessionDocumentState<Unit>(
    'toUnit',
    units[1]?.abbr ?? units[0]?.abbr ?? ('m' as Unit),
  );
  const [value, setValue] = useSessionDocumentState<number>('value', 1);
  const [result, setResult] = useSessionDocumentState<string>('result', '');
  const [error, setError] = useState('');
  const notify = useWorkbenchMemory((s) => s.notify);

  const changeMeasure = (next: Measure) => {
    setMeasure(next);
    const nextUnits = listUnits(next);
    setFromUnit(nextUnits[0]?.abbr ?? ('m' as Unit));
    setToUnit(nextUnits[1]?.abbr ?? nextUnits[0]?.abbr ?? ('m' as Unit));
    setResult('');
    setError('');
  };

  const handleConvert = () => {
    if (!Number.isFinite(value)) {
      setError('Enter a numeric value to convert.');
      return;
    }
    try {
      const output = convertUnitValue(value, fromUnit, toUnit);
      setError('');
      setResult(String(output));
    } catch {
      setError('These units cannot convert directly. Pick units in one measure.');
    }
  };

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify('Result copied');
    } catch {
      notify('Clipboard unavailable. Select the result and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Units</h1>
          <p>Convert a value between units of one measure</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconDeviceDesktop size={18} />
            Session only
          </span>
        </div>
      </div>
      <div className="wb-toolbar">
        <Label className="flex items-center gap-2">
          Measure
          <NativeSelect
            aria-label="Measure"
            value={measure}
            onChange={(e) => changeMeasure(e.target.value as Measure)}
          >
            {measures.map((m) => (
              <NativeSelectOption key={m} value={m}>
                {m}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <Label className="flex items-center gap-2">
          From
          <NativeSelect
            aria-label="From unit"
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value as Unit)}
          >
            {units.map((u) => (
              <NativeSelectOption key={u.abbr} value={u.abbr}>
                {u.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <Label className="flex items-center gap-2">
          To
          <NativeSelect
            aria-label="To unit"
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value as Unit)}
          >
            {units.map((u) => (
              <NativeSelectOption key={u.abbr} value={u.abbr}>
                {u.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
      </div>
      <div className="wb-toolbar">
        <Label className="flex items-center gap-2">
          Value
          <Input
            aria-label="Value to convert"
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </Label>
        <Button type="button" className="wb-button primary" onClick={handleConvert}>
          <IconEqual size={22} stroke={1.7} aria-hidden="true" />
          Convert
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!result}
          onClick={() => void copyText(result)}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy
        </Button>
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      {result ? (
        <div className="wb-setting-row">
          <span>
            <strong>
              {value} {fromUnit} in {toUnit}
            </strong>
            <small>Converted with convert-units</small>
          </span>
          <span data-testid="unit-result">{result}</span>
        </div>
      ) : (
        <div className="wb-empty">
          <h2>No conversion yet</h2>
          <p>Enter a value and press Convert.</p>
        </div>
      )}
    </>
  );
}
