import { IconAlertTriangle, IconEraser, IconShieldCheck, IconSparkles } from '@tabler/icons-react';
import Ajv from 'ajv';
import type { AnySchema } from 'ajv';
import addFormats from 'ajv-formats';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

export interface SchemaValidation {
  valid: boolean;
  errors: string[];
}

/** Pure schema validation ported from the legacy JsonValidator (ajv + formats). */
export function validateJsonAgainstSchema(dataText: string, schemaText: string): SchemaValidation {
  try {
    const data: unknown = JSON.parse(dataText);
    const schema: unknown = JSON.parse(schemaText);
    const ajv = new Ajv();
    addFormats(ajv);
    const validate = ajv.compile(schema as AnySchema);
    if (validate(data)) return { valid: true, errors: [] };
    const errors = (validate.errors ?? []).map(
      (err) => `${err.instancePath || 'root'}: ${err.message ?? 'invalid'}`,
    );
    return { valid: false, errors: errors.length ? errors : ['Unknown validation error'] };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Invalid JSON or schema'],
    };
  }
}

const SAMPLE_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["name"],
  "additionalProperties": false
}`;

const SAMPLE_DATA = `{
  "name": "Ada",
  "age": 36
}`;

export function JsonSchemaScreen() {
  const [jsonData, setJsonData] = useDocumentField<string>('jsonData', '');
  const [schema, setSchema] = useDocumentField<string>('schema', '');
  const [validation, setValidation] = useSessionDocumentState<SchemaValidation | null>(
    'validation',
    null,
  );
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const validate = () => {
    const result = validateJsonAgainstSchema(jsonData, schema);
    setValidation(result);
    notify(result.valid ? 'JSON is valid against the schema' : 'Validation failed');
  };
  const loadSample = () => {
    setSchema(SAMPLE_SCHEMA);
    setJsonData(SAMPLE_DATA);
    setValidation(null);
  };
  const clear = () => {
    setSchema('');
    setJsonData('');
    setValidation(null);
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>JSON Validator</h1>
          <p>Validate JSON against a schema</p>
        </div>
        <div className="wb-processing">
          {validation ? (
            <span className={validation.valid ? 'wb-green' : undefined}>
              <IconShieldCheck size={18} />
              {validation.valid ? 'Valid against schema' : 'Validation failed'}
            </span>
          ) : (
            <span>
              <IconShieldCheck size={18} />
              AJV schema validation
            </span>
          )}
        </div>
      </div>

      <div className="wb-toolbar">
        <button type="button" className="wb-button primary" onClick={validate}>
          <IconShieldCheck size={22} stroke={1.7} aria-hidden="true" />
          Validate
        </button>
        <button type="button" className="wb-button" onClick={loadSample}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
        <button type="button" className="wb-button" onClick={clear}>
          <IconEraser size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </button>
      </div>

      {validation && !validation.valid && (
        <div className="wb-error-banner" role="alert">
          <strong>Validation failed.</strong>
          {validation.errors.map((message) => (
            <span key={message}>{message}</span>
          ))}
        </div>
      )}

      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="JSON schema panel">
          <div className="wb-pane-header">
            <h2>Schema</h2>
            <button
              type="button"
              className="wb-button quiet wb-clear"
              onClick={() => setSchema('')}
            >
              Clear
            </button>
          </div>
          <CodeEditor
            value={schema}
            onChange={setSchema}
            language="json"
            wrap={wrap}
            label="JSON schema"
            placeholder='{"type": "object", "properties": {"name": {"type": "string"}}}'
          />
          <div className="wb-pane-footer">
            <span>{schema.length} characters</span>
            <span className="wb-file-type">JSON</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="JSON data panel">
          <div className="wb-pane-header">
            <h2>Data</h2>
            <span className={validation?.valid ? 'wb-result-state wb-green' : 'wb-result-state'}>
              {validation ? (validation.valid ? 'Valid' : 'Invalid') : 'Not validated'}
            </span>
            <button
              type="button"
              className="wb-button quiet wb-clear"
              onClick={() => setJsonData('')}
            >
              Clear
            </button>
          </div>
          <CodeEditor
            value={jsonData}
            onChange={setJsonData}
            language="json"
            wrap={wrap}
            label="JSON data"
            placeholder='{"name": "Ada", "age": 36}'
          />
          <div className="wb-pane-footer">
            <span>{jsonData.length} characters</span>
            <span className="wb-file-type">JSON</span>
          </div>
        </section>
      </div>

      <div className="wb-section-title-row">
        <h2>Errors ({validation?.errors.length ?? 0})</h2>
      </div>
      {!validation || validation.errors.length === 0 ? (
        <div className="wb-empty">
          <h2>{validation?.valid ? 'Valid against schema' : 'No validation yet'}</h2>
          <p>
            {validation?.valid
              ? 'The data satisfies every schema rule.'
              : 'Add a schema and data, then run Validate to list errors here.'}
          </p>
        </div>
      ) : (
        validation.errors.map((message) => (
          <div key={message} className="wb-list-row">
            <IconAlertTriangle size={22} aria-hidden="true" />
            <span>
              <strong>{message}</strong>
            </span>
          </div>
        ))
      )}
    </>
  );
}
