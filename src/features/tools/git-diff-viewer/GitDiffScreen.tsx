import { useMemo } from 'react';
import { IconCopy, IconGitCompare, IconSparkles } from '@tabler/icons-react';
import { parsePatch } from 'diff';
import type { StructuredPatch } from 'diff';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';

export interface PatchStats {
  files: number;
  additions: number;
  deletions: number;
}

export interface ParsedPatch {
  files: StructuredPatch[];
  stats: PatchStats;
}

export interface FileChanges {
  add: number;
  del: number;
}

export const GIT_DIFF_SAMPLE = `diff --git a/src/utils/auth.ts b/src/utils/auth.ts
index abc1234..def5678 100644
--- a/src/utils/auth.ts
+++ b/src/utils/auth.ts
@@ -1,6 +1,17 @@
-import { hash } from 'crypto';
+import { hash, compare } from 'crypto';
+import { Logger } from '@/features/tools/logger';
 
  export function authenticate(username: string, password: string) {
-  const hashedPassword = hash(password);
-  return db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, hashedPassword]);
+  const logger = new Logger('auth');
+  logger.info(\`Login attempt for user: \${username}\`);
+
+  const hashedPassword = hash(password, 'sha256');
+  const user = db.query('SELECT * FROM users WHERE username = ?', [username]);
+
+  if (!user || !compare(hashedPassword, user.password)) {
+    logger.warn(\`Failed login for user: \${username}\`);
+    return null;
+  }
+
+  return user;
  }
diff --git a/src/config.ts b/src/config.ts
index 111aaaa..222bbbb 100644
--- a/src/config.ts
+++ b/src/config.ts
@@ -5,3 +5,5 @@ export const config = {
   port: 3000,
   host: 'localhost',
+  logLevel: 'info',
+  maxRetries: 3,
  };`;

/** Strip ANSI color codes, as in the legacy viewer. */
export function stripAnsiCodes(value: string): string {
  let result = '';
  let i = 0;
  while (i < value.length) {
    const char = value[i];
    if (char === '' && value[i + 1] === '[') {
      i += 2;
      while (i < value.length && value[i] !== 'm') i++;
      if (i < value.length && value[i] === 'm') i++;
      continue;
    }
    result += char;
    i++;
  }
  return result;
}

export function normalizePatchInput(input: string): string {
  return stripAnsiCodes(input.replace(/\r\n/g, '\n'));
}

/** Parse a unified patch; unparseable input yields zero files (legacy behavior). */
export function parseGitPatch(input: string): ParsedPatch {
  const normalized = normalizePatchInput(input);
  const empty: ParsedPatch = { files: [], stats: { files: 0, additions: 0, deletions: 0 } };
  if (!normalized.trim()) return empty;
  try {
    const files = parsePatch(normalized);
    let additions = 0;
    let deletions = 0;
    for (const file of files) {
      for (const hunk of file.hunks) {
        for (const line of hunk.lines) {
          if (line.startsWith('+')) additions++;
          else if (line.startsWith('-')) deletions++;
        }
      }
    }
    return { files, stats: { files: files.length, additions, deletions } };
  } catch {
    return empty;
  }
}

export function getPatchFileName(file: StructuredPatch): string {
  return (
    file.newFileName?.replace(/^[ab]\//, '') ||
    file.oldFileName?.replace(/^[ab]\//, '') ||
    'unknown'
  );
}

export function countFileChanges(file: StructuredPatch): FileChanges {
  let add = 0;
  let del = 0;
  for (const hunk of file.hunks) {
    for (const line of hunk.lines) {
      if (line.startsWith('+')) add++;
      else if (line.startsWith('-')) del++;
    }
  }
  return { add, del };
}

/** Plain-text hunk view for the selected file (keeps +/- prefixes). */
export function buildHunkText(file: StructuredPatch): string {
  const out: string[] = [];
  for (const hunk of file.hunks) {
    out.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);
    for (const line of hunk.lines) out.push(line);
  }
  return out.join('\n');
}

export function GitDiffScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [selectedFile, setSelectedFile] = useSessionDocumentState<number>('selectedFile', 0);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const parsed = useMemo(() => parseGitPatch(input), [input]);
  const safeIndex =
    parsed.files.length === 0 ? 0 : Math.min(Math.max(0, selectedFile), parsed.files.length - 1);
  const active = parsed.files[safeIndex];
  const hunkText = useMemo(() => (active ? buildHunkText(active) : ''), [active]);

  const copyPatch = async () => {
    if (!input) return;
    try {
      await navigator.clipboard.writeText(normalizePatchInput(input));
      notify('Patch copied');
    } catch {
      notify('Clipboard unavailable. Select the patch and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Git Diff</h1>
          <p>View unified git patches</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconGitCompare size={18} />
            {parsed.stats.files} file{parsed.stats.files === 1 ? '' : 's'} changed
          </span>
          <span>
            +{parsed.stats.additions} -{parsed.stats.deletions}
          </span>
        </div>
      </div>
      <div className="wb-toolbar">
        <Button
          type="button"
          className="wb-button primary"
          onClick={() => setInput(GIT_DIFF_SAMPLE)}
        >
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setInput('')}
          disabled={!input}
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => void copyPatch()}
          disabled={!input}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy patch
        </Button>
      </div>
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Patch input panel">
          <div className="wb-pane-header">
            <h2>Patch</h2>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            wrap={wrap}
            label="Git patch input"
            placeholder="Paste git diff output here..."
          />
          <div className="wb-pane-footer">
            <span>{input.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Files panel">
          <div className="wb-pane-header">
            <h2>Files ({parsed.stats.files})</h2>
          </div>
          {parsed.files.length > 0 ? (
            <div>
              {parsed.files.map((file, index) => {
                const name = getPatchFileName(file);
                const counts = countFileChanges(file);
                return (
                  <Button
                    key={`${name}-${index}`}
                    type="button"
                    variant="ghost"
                    className="wb-list-row text-left justify-start h-auto w-full"
                    onClick={() => setSelectedFile(index)}
                    aria-pressed={index === safeIndex}
                  >
                    <span>
                      <strong>{name}</strong>
                      <small>
                        +{counts.add} -{counts.del} · {file.hunks.length} hunk
                        {file.hunks.length === 1 ? '' : 's'}
                      </small>
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="wb-empty">
              <h2>No files yet</h2>
              <p>Paste a unified patch to list changed files with line counts.</p>
            </div>
          )}
          <div className="wb-pane-footer">
            <span>
              {parsed.stats.files > 0
                ? `+${parsed.stats.additions} additions · -${parsed.stats.deletions} deletions`
                : 'Waiting for input'}
            </span>
          </div>
        </section>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Selected file</strong>
          <small>{active ? getPatchFileName(active) : 'No file selected.'}</small>
        </span>
      </div>
      <section className="wb-editor-pane" aria-label="Hunk view panel">
        <div className="wb-pane-header">
          <h2>Hunks{active ? ` · ${active.hunks.length}` : ''}</h2>
        </div>
        <CodeEditor
          value={hunkText}
          readOnly
          wrap={wrap}
          label="Selected file hunks"
          placeholder="Select a file to inspect its hunks..."
        />
        <div className="wb-pane-footer">
          <span>{hunkText ? `${hunkText.split('\n').length} lines` : 'Waiting for input'}</span>
        </div>
      </section>
    </>
  );
}
