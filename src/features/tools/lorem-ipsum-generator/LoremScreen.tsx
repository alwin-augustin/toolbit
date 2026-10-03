import { useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconRefresh,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';

export const LOREM_WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
  'perspiciatis',
  'unde',
  'omnis',
  'iste',
  'natus',
  'error',
  'voluptatem',
  'accusantium',
  'doloremque',
  'laudantium',
  'totam',
  'rem',
  'aperiam',
  'eaque',
  'ipsa',
  'quae',
  'ab',
  'illo',
  'inventore',
  'veritatis',
  'quasi',
  'architecto',
  'beatae',
  'vitae',
  'dicta',
  'explicabo',
  'nemo',
  'ipsam',
  'quia',
  'voluptas',
  'aspernatur',
  'aut',
  'odit',
  'fugit',
  'consequuntur',
  'magni',
  'dolores',
  'eos',
  'ratione',
  'sequi',
  'nesciunt',
  'neque',
  'porro',
  'quisquam',
  'dolorem',
  'adipisci',
  'numquam',
  'eius',
  'modi',
  'tempora',
  'magnam',
  'quaerat',
  'minima',
  'nostrum',
  'exercitationem',
  'ullam',
  'corporis',
  'suscipit',
  'laboriosam',
];

export type LoremMode = 'paragraphs' | 'sentences' | 'words';

export interface LoremOptions {
  startWithLorem: boolean;
  htmlOutput: boolean;
}

export type RandomFn = () => number;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateLoremWords(count: number, random: RandomFn = Math.random): string[] {
  const words: string[] = [];
  for (let i = 0; i < Math.max(0, Math.trunc(count)); i++) {
    words.push(LOREM_WORDS[Math.floor(random() * LOREM_WORDS.length)]);
  }
  return words;
}

export function generateLoremSentence(
  random: RandomFn = Math.random,
  minWords = 6,
  maxWords = 15,
): string {
  const count = minWords + Math.floor(random() * (maxWords - minWords + 1));
  return `${capitalize(generateLoremWords(count, random).join(' '))}.`;
}

export function generateLoremParagraph(
  random: RandomFn = Math.random,
  minSentences = 3,
  maxSentences = 7,
): string {
  const count = minSentences + Math.floor(random() * (maxSentences - minSentences + 1));
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) sentences.push(generateLoremSentence(random));
  return sentences.join(' ');
}

/** Same composition rules as the legacy generator, with injectable randomness. */
export function generateLorem(
  mode: LoremMode,
  count: number,
  options: LoremOptions,
  random: RandomFn = Math.random,
): string {
  const safeCount = Math.max(1, Math.trunc(count) || 1);
  switch (mode) {
    case 'paragraphs': {
      const paragraphs: string[] = [];
      for (let i = 0; i < safeCount; i++) {
        let p = generateLoremParagraph(random);
        if (i === 0 && options.startWithLorem) {
          p = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${p}`;
        }
        paragraphs.push(p);
      }
      return options.htmlOutput
        ? paragraphs.map((p) => `<p>${p}</p>`).join('\n\n')
        : paragraphs.join('\n\n');
    }
    case 'sentences': {
      const sentences: string[] = [];
      for (let i = 0; i < safeCount; i++) sentences.push(generateLoremSentence(random));
      if (options.startWithLorem && sentences.length > 0) {
        sentences[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      }
      return sentences.join(' ');
    }
    case 'words': {
      const words = generateLoremWords(safeCount, random);
      if (options.startWithLorem && words.length >= 2) {
        words[0] = 'lorem';
        words[1] = 'ipsum';
      }
      return words.join(' ');
    }
  }
}

export function LoremScreen() {
  const [count, setCount] = useSessionDocumentState<number>('count', 3);
  const [mode, setMode] = useSessionDocumentState<LoremMode>('mode', 'paragraphs');
  const [startWithLorem, setStartWithLorem] = useSessionDocumentState<boolean>(
    'startWithLorem',
    true,
  );
  const [htmlOutput, setHtmlOutput] = useSessionDocumentState<boolean>('htmlOutput', false);
  const [output, setOutput] = useSessionDocumentState<string>('output', '');
  const [error, setError] = useState('');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const generate = () => {
    const safeCount = Math.max(1, Math.min(100, Math.trunc(count) || 1));
    setCount(safeCount);
    setError('');
    setOutput(generateLorem(mode, safeCount, { startWithLorem, htmlOutput }));
    notify(`${safeCount} ${mode} generated`);
  };

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify('Placeholder text copied');
    } catch {
      notify('Clipboard unavailable. Select the output and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Lorem Ipsum</h1>
          <p>Generate placeholder paragraphs, sentences, or words</p>
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
        <label>
          Count
          <input
            aria-label="Count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </label>
        <label>
          Type
          <NativeSelect
            aria-label="Output type"
            value={mode}
            onChange={(e) => setMode(e.target.value as LoremMode)}
          >
            <NativeSelectOption value="paragraphs">Paragraphs</NativeSelectOption>
            <NativeSelectOption value="sentences">Sentences</NativeSelectOption>
            <NativeSelectOption value="words">Words</NativeSelectOption>
          </NativeSelect>
        </label>
        <button type="button" className="wb-button primary" onClick={generate}>
          <IconRefresh size={22} stroke={1.7} aria-hidden="true" />
          Generate
        </button>
        <button
          type="button"
          className="wb-button"
          disabled={!output}
          onClick={() => void copyText(output)}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy
        </button>
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-setting-row">
        <span>
          <strong>Start with &quot;Lorem ipsum...&quot;</strong>
          <small>Classic opening sentence for the first block</small>
        </span>
        <Checkbox
          aria-label="Start with Lorem ipsum"
          checked={startWithLorem}
          onCheckedChange={(checked) => setStartWithLorem(Boolean(checked))}
        />
      </div>
      {mode === 'paragraphs' ? (
        <div className="wb-setting-row">
          <span>
            <strong>HTML &lt;p&gt; tags</strong>
            <small>Wrap each paragraph in a paragraph element</small>
          </span>
          <Checkbox
            aria-label="HTML paragraph tags"
            checked={htmlOutput}
            onCheckedChange={(checked) => setHtmlOutput(Boolean(checked))}
          />
        </div>
      ) : null}
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Placeholder text panel">
          <div className="wb-pane-header">
            <h2>Output</h2>
          </div>
          <CodeEditor
            value={output}
            readOnly
            wrap={wrap}
            language="text"
            label="Generated placeholder text"
            placeholder="Press Generate to create placeholder text."
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>{output ? `${count} ${mode}` : 'Nothing yet'}</span>
          </div>
        </section>
      </div>
    </>
  );
}
