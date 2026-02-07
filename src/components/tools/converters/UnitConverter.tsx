import React, { useMemo, useState } from 'react';
import convert, { Measure, Unit, System } from 'convert-units';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToolCard } from '@/components/ToolCard';
import { useUrlState } from '@/hooks/use-url-state';
import { Hash } from 'lucide-react';
import { useToolHistory } from '@/hooks/use-tool-history';

const measures = convert().measures();

type UnitInfo = {
  abbr: Unit;
  measure: Measure;
  system: System;
  singular: string;
  plural: string;
};

const UnitConverter: React.FC = () => {
  const [measure, setMeasure] = useState<Measure>(measures[0]);
  const [fromUnit, setFromUnit] = useState<Unit>(convert().list(measure)[0].abbr);
  const [toUnit, setToUnit] = useState<Unit>(convert().list(measure)[1].abbr);
  const [value, setValue] = useState(1);
  const [result, setResult] = useState(convert(1).from(fromUnit).to(toUnit));
  const shareState = useMemo(
    () => ({ measure, fromUnit, toUnit, value }),
    [measure, fromUnit, toUnit, value],
  );
  const { getShareUrl } = useUrlState(shareState, (state) => {
    const nextMeasure = typeof state.measure === 'string' ? (state.measure as Measure) : measures[0];
    setMeasure(nextMeasure);
    const units = convert().list(nextMeasure);
    const fallbackFrom = units[0]?.abbr;
    const fallbackTo = units[1]?.abbr || units[0]?.abbr;
    setFromUnit((typeof state.fromUnit === 'string' ? (state.fromUnit as Unit) : fallbackFrom) || fallbackFrom);
    setToUnit((typeof state.toUnit === 'string' ? (state.toUnit as Unit) : fallbackTo) || fallbackTo);
    setValue(typeof state.value === 'number' ? state.value : 1);
  });
  const { addEntry } = useToolHistory('unit-converter', 'Unit Converter');

  const handleConvert = () => {
    const output = convert(value).from(fromUnit).to(toUnit);
    setResult(output);
    addEntry({
      input: JSON.stringify({ measure, fromUnit, toUnit, value }),
      output: String(output),
      metadata: { action: 'convert' },
    });
  };

  const handleMeasureChange = (newMeasure: Measure) => {
    setMeasure(newMeasure);
    const units = convert().list(newMeasure);
    setFromUnit(units[0].abbr);
    setToUnit(units[1] ? units[1].abbr : units[0].abbr);
  };

  return (
    <ToolCard
      title="Unit Converter"
      description="Convert between different units of measurement"
      icon={<Hash className="h-5 w-5" />}
      shareUrl={getShareUrl()}
      history={{
        toolId: 'unit-converter',
        toolName: 'Unit Converter',
        onRestore: (entry) => {
          try {
            const parsed = JSON.parse(entry.input || '{}') as { measure?: Measure; fromUnit?: Unit; toUnit?: Unit; value?: number };
            setMeasure(parsed.measure || measures[0]);
            setFromUnit(parsed.fromUnit || convert().list(parsed.measure || measures[0])[0].abbr);
            setToUnit(parsed.toUnit || convert().list(parsed.measure || measures[0])[1].abbr);
            setValue(typeof parsed.value === 'number' ? parsed.value : 1);
          } catch {
            setValue(1);
          }
        },
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select onValueChange={handleMeasureChange} value={measure}>
          <SelectTrigger>
            <SelectValue placeholder="Measure" />
          </SelectTrigger>
          <SelectContent>
            {measures.map((m: Measure) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setFromUnit(value as Unit)} value={fromUnit}>
          <SelectTrigger>
            <SelectValue placeholder="From" />
          </SelectTrigger>
          <SelectContent>
            {convert().list(measure).map((u: UnitInfo) => (
              <SelectItem key={u.abbr} value={u.abbr}>{u.singular} ({u.abbr})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setToUnit(value as Unit)} value={toUnit}>
          <SelectTrigger>
            <SelectValue placeholder="To" />
          </SelectTrigger>
          <SelectContent>
            {convert().list(measure).map((u: UnitInfo) => (
              <SelectItem key={u.abbr} value={u.abbr}>{u.singular} ({u.abbr})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
        <Button onClick={handleConvert}>Convert</Button>
      </div>
      <Input readOnly value={result} />
    </ToolCard>
  );
};

export default UnitConverter;
