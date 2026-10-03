import { IconCopy, IconSparkles } from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';

export interface WordStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  sentences: number;
}

export const WORD_SAMPLE =
  'The quick brown fox jumps over the lazy dog. This is a sample paragraph for testing the word counter tool.\n\nIt contains multiple sentences and paragraphs. You can see the statistics update in real time as you type!';

// Logic matches the legacy WordCounter exactly.
export function computeWordStats(text: string): WordStats {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split('\n').length : 0;
  const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
  return { characters, charactersNoSpaces, words, lines, paragraphs, sentences };
}

export function readingTimeText(words: number): string {
  if (words <= 0) return '0 sec';
  const seconds = Math.ceil((words / 200) * 60);
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} sec`;
}

export function WordScreen() {
  const [text, setText] = useDocumentField<string>('text', '');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const stats = computeWordStats(text);
  const readingTime = readingTimeText(stats.words);

  const copyText = async () => {
    const summary = `Words: ${stats.words}\nCharacters: ${stats.characters}\nCharacters (no spaces): ${stats.charactersNoSpaces}\nLines: ${stats.lines}\nParagraphs: ${stats.paragraphs}\nSentences: ${stats.sentences}`;
    try {
      await navigator.clipboard.writeText(summary);
      notify('Statistics copied');
    } catch {
      notify('Clipboard unavailable. Select the values and copy them.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Word Counter</h1>
          <p>Count words, characters, and sentences</p>
        </div>
      </div>
      <div className="wb-toolbar">
        <Button type="button" className="wb-button primary" onClick={() => setText(WORD_SAMPLE)}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setText('')}
          disabled={!text}
        >
          Clear
        </Button>
        <div className="wb-copy-actions">
          <Button
            type="button"
            className="wb-button primary"
            disabled={!text.trim()}
            onClick={() => void copyText()}
          >
            <IconCopy size={22} stroke={1.7} aria-hidden="true" />
            Copy stats
          </Button>
        </div>
      </div>
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Text panel">
          <div className="wb-pane-header">
            <h2>Text</h2>
          </div>
          <CodeEditor
            value={text}
            onChange={setText}
            wrap={wrap}
            label="Input text"
            placeholder="Type or paste your text here..."
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>
              {stats.words.toLocaleString()} {stats.words === 1 ? 'word' : 'words'}
            </span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Statistics panel">
          <div className="wb-pane-header">
            <h2>Statistics</h2>
          </div>
          <div>
            <div className="wb-setting-row">
              <span>
                <strong>Words</strong>
                <small>Separated by whitespace</small>
              </span>
              <span data-testid="stat-words">{stats.words.toLocaleString()}</span>
            </div>
            <div className="wb-setting-row">
              <span>
                <strong>Characters</strong>
                <small>Including spaces</small>
              </span>
              <span data-testid="stat-characters">{stats.characters.toLocaleString()}</span>
            </div>
            <div className="wb-setting-row">
              <span>
                <strong>Characters (no spaces)</strong>
                <small>Whitespace removed</small>
              </span>
              <span data-testid="stat-characters-no-spaces">
                {stats.charactersNoSpaces.toLocaleString()}
              </span>
            </div>
            <div className="wb-setting-row">
              <span>
                <strong>Lines</strong>
                <small>Newline separated</small>
              </span>
              <span data-testid="stat-lines">{stats.lines.toLocaleString()}</span>
            </div>
            <div className="wb-setting-row">
              <span>
                <strong>Paragraphs</strong>
                <small>Blank-line separated</small>
              </span>
              <span data-testid="stat-paragraphs">{stats.paragraphs.toLocaleString()}</span>
            </div>
            <div className="wb-setting-row">
              <span>
                <strong>Sentences</strong>
                <small>Ended by . ! ?</small>
              </span>
              <span data-testid="stat-sentences">{stats.sentences.toLocaleString()}</span>
            </div>
            <div className="wb-setting-row">
              <span>
                <strong>Reading time</strong>
                <small>At 200 words per minute</small>
              </span>
              <span data-testid="stat-reading-time">{readingTime}</span>
            </div>
          </div>
          <div className="wb-pane-footer">
            <span>
              {stats.words.toLocaleString()} {stats.words === 1 ? 'word' : 'words'}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
