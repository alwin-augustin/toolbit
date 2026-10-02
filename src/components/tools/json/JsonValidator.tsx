import { useSessionDocumentState } from '@/v2/document-state';
import { useDocumentField } from '@/v2/document-state';
import { useMemo, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { Button } from '@/ds/components';
import { CodeEditor } from '@/v2/CodeEditor';
import { Panel, PanelHeader, ValidityBadge, EditorSplit } from '@/v2/EditorPanels';
import { useEditorStatus } from '@/v2/workspace-store';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';

export default function JsonValidator() {
  const [jsonData, setJsonData] = useDocumentField<string>('jsonData', '');
  const [schema, setSchema] = useDocumentField<string>('schema', '');
  const [result, setResult] = useSessionDocumentState('result', '');
  const [isValid, setIsValid] = useSessionDocumentState('isValid', true);
  const shareState = useMemo(() => ({ jsonData, schema }), [jsonData, schema]);
  useUrlState(shareState, (state) => {
    setJsonData(typeof state.jsonData === 'string' ? state.jsonData : '');
    setSchema(typeof state.schema === 'string' ? state.schema : '');
  });
  const { addEntry } = useToolHistory('json-validator', 'JSON Validator');
  const setStatus = useEditorStatus((s) => s.setStatus);

  const validateJson = () => {
    try {
      const parsedData = JSON.parse(jsonData);
      const parsedSchema = JSON.parse(schema);

      const ajv = new Ajv();
      addFormats(ajv);
      const validate = ajv.compile(parsedSchema);
      const valid = validate(parsedData);

      if (valid) {
        setResult('JSON is valid according to the schema');
        setIsValid(true);
        addEntry({
          input: JSON.stringify({ jsonData, schema }),
          output: 'valid',
          metadata: { action: 'validate' },
        });
      } else {
        const errors =
          validate.errors
            ?.map((err) => `${err.instancePath || 'root'}: ${err.message}`)
            .join('\n') || 'Unknown validation error';
        setResult(`Validation failed:\n${errors}`);
        setIsValid(false);
        addEntry({
          input: JSON.stringify({ jsonData, schema }),
          output: errors,
          metadata: { action: 'validate' },
        });
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Invalid JSON or schema'}`);
      setIsValid(false);
      addEntry({
        input: JSON.stringify({ jsonData, schema }),
        output: 'error',
        metadata: { action: 'validate' },
      });
    }
  };

  useEffect(() => {
    setStatus({
      valid: result ? isValid : null,
      validityLabel: result ? (isValid ? 'Valid against schema' : 'Validation failed') : '',
    });
  }, [result, isValid, setStatus]);

  return (
    <EditorSplit>
      <Panel>
        <PanelHeader title="JSON Schema" />
        <CodeEditor
          value={schema}
          onChange={setSchema}
          language="json"
          placeholder='{"type": "object", "properties": {"name": {"type": "string"}}}'
        />
      </Panel>
      <Panel>
        <PanelHeader
          title="JSON Data"
          badge={
            result ? (
              <ValidityBadge valid={isValid} validLabel="valid" invalidLabel="invalid" />
            ) : undefined
          }
          action={
            <Button size="sm" onClick={validateJson} iconLeft={<ShieldCheck size={14} />}>
              Validate
            </Button>
          }
        />
        <CodeEditor
          value={jsonData}
          onChange={setJsonData}
          language="json"
          reportStatus
          placeholder='{"name": "John", "age": 30}'
        />
        {result && (
          <div
            style={{
              flexShrink: 0,
              maxHeight: 160,
              overflow: 'auto',
              padding: '10px 12px',
              borderTop: '1px solid hsl(var(--border-faint))',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: isValid ? 'hsl(var(--success))' : 'hsl(var(--danger))',
            }}
          >
            {result}
          </div>
        )}
      </Panel>
    </EditorSplit>
  );
}
