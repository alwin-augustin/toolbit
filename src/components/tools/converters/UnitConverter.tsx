import React, { useMemo, useState } from 'react';
import convert, { Measure, Unit, System } from 'convert-units';
import { Button, Card, Input, Select } from '@/ds/components';
import { CopyAction } from '@/v2/EditorPanels';
import { ToolPage, Field, Row, SectionTitle, Stat } from '@/v2/restyle-kit';
import { useUrlState } from '@/hooks/use-url-state';
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
  useUrlState(shareState, (state) => {
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
    <ToolPage>
      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          <SectionTitle>Conversion</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Measure">
              <Select
                fullWidth
                value={measure}
                onChange={(e) => handleMeasureChange(e.target.value as Measure)}
              >
                {measures.map((m: Measure) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </Field>
            <Field label="From">
              <Select
                fullWidth
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as Unit)}
              >
                {convert().list(measure).map((u: UnitInfo) => (
                  <option key={u.abbr} value={u.abbr}>{u.singular} ({u.abbr})</option>
                ))}
              </Select>
            </Field>
            <Field label="To">
              <Select
                fullWidth
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value as Unit)}
              >
                {convert().list(measure).map((u: UnitInfo) => (
                  <option key={u.abbr} value={u.abbr}>{u.singular} ({u.abbr})</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Value">
            <Row wrap={false}>
              <Input
                type="number"
                mono
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <Button onClick={handleConvert}>Convert</Button>
            </Row>
          </Field>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'grid', gap: 8 }}>
          <SectionTitle>Result</SectionTitle>
          <Stat label={`${value} ${fromUnit} in ${toUnit}`} value={String(result)} />
          <Row wrap={false}>
            <Input mono readOnly value={String(result)} style={{ flex: 1 }} />
            <CopyAction text={String(result)} />
          </Row>
        </div>
      </Card>
    </ToolPage>
  );
};

export default UnitConverter;
