import React, { useState } from 'react';
import convert, { Measure, Unit, System } from 'convert-units';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const handleConvert = () => {
    setResult(convert(value).from(fromUnit).to(toUnit));
  };

  const handleMeasureChange = (newMeasure: Measure) => {
    setMeasure(newMeasure);
    const units = convert().list(newMeasure);
    setFromUnit(units[0].abbr);
    setToUnit(units[1] ? units[1].abbr : units[0].abbr);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Unit Converter</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
      <div className="flex gap-2 mb-2">
        <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
        <Button onClick={handleConvert}>Convert</Button>
      </div>
      <Input readOnly value={result} />
    </div>
  );
};

export default UnitConverter;