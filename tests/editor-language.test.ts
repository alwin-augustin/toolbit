import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_LABELS,
  isEditorLanguage,
  languageLabel,
  loadLanguageSupport,
} from '@/shared/editor-language';
import { ALL_SPECS, defaultDocState, specLanguages } from '@/features/tools/specs';

const languages = Object.keys(LANGUAGE_LABELS);

describe('editor languages', () => {
  it('gives every language its own status label', () => {
    const labels = Object.values(LANGUAGE_LABELS);
    expect(labels.every((label) => label.trim().length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('narrows only languages it knows', () => {
    expect(isEditorLanguage('sql')).toBe(true);
    expect(isEditorLanguage('text')).toBe(true);
    expect(isEditorLanguage('cobol')).toBe(false);
    // Inherited object keys are not languages.
    expect(isEditorLanguage('constructor')).toBe(false);
    expect(isEditorLanguage('toString')).toBe(false);
    expect(isEditorLanguage(7)).toBe(false);
    expect(isEditorLanguage(undefined)).toBe(false);
  });

  it('answers with a label for every language', () => {
    for (const language of languages) {
      expect(languageLabel(language as keyof typeof LANGUAGE_LABELS)).toBe(
        LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS],
      );
    }
  });

  it('loads a grammar for a language and nothing for plain text or a diff', async () => {
    const sql = await loadLanguageSupport('sql');
    expect(sql.length).toBeGreaterThan(0);
    expect(await loadLanguageSupport('text')).toEqual([]);
    // A diff is coloured by line decoration the editor owns, not by a grammar.
    expect(await loadLanguageSupport('diff')).toEqual([]);
  });

  it('handles every language in the registry', async () => {
    for (const language of languages) {
      const extensions = await loadLanguageSupport(language as keyof typeof LANGUAGE_LABELS);
      expect(Array.isArray(extensions), language).toBe(true);
      if (language === 'text' || language === 'diff') expect(extensions, language).toEqual([]);
      else expect(extensions.length, language).toBeGreaterThan(0);
    }
  });

  it('loads a language once and shares the answer', async () => {
    const [first, second] = await Promise.all([
      loadLanguageSupport('yaml'),
      loadLanguageSupport('yaml'),
    ]);
    expect(first).toBe(second);
  });
});

describe('tool languages', () => {
  it('names the language each pane of a tool holds', () => {
    const cases: Array<[string, string, string, string]> = [
      ['json-formatter', 'format', 'json', 'json'],
      ['yaml-formatter', 'format', 'yaml', 'yaml'],
      ['yaml-formatter', 'to-json', 'yaml', 'json'],
      // "JSON to YAML" reads JSON, so the input pane is JSON and the result YAML.
      ['yaml-formatter', 'from-json', 'json', 'yaml'],
      // The input is CSV, which has no grammar here; the result is JSON.
      ['csv-to-json', 'convert', 'text', 'json'],
      ['sql-formatter', 'format', 'sql', 'sql'],
      ['css-formatter', 'minify', 'css', 'css'],
      ['graphql-formatter', 'format', 'graphql', 'graphql'],
      ['js-json-minifier', 'minify', 'javascript', 'javascript'],
      ['html-escape', 'escape', 'html', 'html'],
      // Text tools stay plain: no grammar is claimed that would not be true.
      ['base64-encoder', 'decode', 'text', 'text'],
      ['timestamp-converter', 'format', 'text', 'text'],
      ['strip-whitespace', 'normalize', 'text', 'text'],
    ];

    for (const [id, mode, input, result] of cases) {
      const spec = ALL_SPECS[id];
      expect(spec, id).toBeDefined();
      const doc = { ...defaultDocState(id), mode };
      expect(specLanguages(doc, spec), `${id} · ${mode}`).toEqual({ input, result });
    }
  });

  it('only declares languages the editor can load', () => {
    for (const spec of Object.values(ALL_SPECS)) {
      // A tool declares either one language for both panes or one per mode, so
      // both shapes must name grammars the editor can actually load.
      const input = spec.language;
      if (typeof input === 'string') {
        expect(isEditorLanguage(input), spec.id).toBe(true);
      } else if (input) {
        for (const [mode, language] of Object.entries(input)) {
          expect(isEditorLanguage(language), `${spec.id} · ${mode}`).toBe(true);
        }
      }
      const result = spec.resultLanguage;
      if (typeof result === 'string') {
        expect(isEditorLanguage(result), spec.id).toBe(true);
      } else if (result) {
        for (const [mode, language] of Object.entries(result)) {
          expect(isEditorLanguage(language), `${spec.id} · ${mode}`).toBe(true);
        }
      }
    }
  });
});
