import { useState } from 'react';
import { IconArrowRight, IconBraces } from '@tabler/icons-react';
import { detectContentType } from '@/core/smart-detect';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { getSpec } from '@/features/tools/specs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const PINNED = ['json-formatter', 'base64-encoder', 'timestamp-converter'];

export function StartScreen() {
  const [scratch, setScratch] = useState('');
  const saved = useWorkbenchMemory((s) => s.saved);
  const { openTool, restore, navigate } = useWorkbenchActions();

  const suggestions = detectContentType(scratch);
  const suggested = suggestions.find((s) => getSpec(s.toolId));
  const sessions = saved.filter((s) => s.kind === 'Sessions').slice(0, 3);

  return (
    <>
      <div className="wb-page-heading">
        <h1>Start</h1>
        <p>A quick place to pick up your next task.</p>
      </div>
      <section className="wb-smart-paste">
        <h2>What are you working with?</h2>
        <Textarea
          aria-label="Paste data to find a tool"
          placeholder="Paste JSON, a timestamp, or encoded text..."
          value={scratch}
          onChange={(e) => setScratch(e.target.value)}
        />
        <div>
          <p>
            {suggested
              ? `${suggested.reason}. Try ${getSpec(suggested.toolId)?.title} with this data.`
              : 'Pick a tool, or paste data to get started.'}
          </p>
          {suggested && (
            <Button
              type="button"
              className="wb-button primary"
              onClick={() => openTool(suggested.toolId, scratch)}
            >
              <IconArrowRight size={22} stroke={1.7} aria-hidden="true" data-icon="inline-start" />
              Open {getSpec(suggested.toolId)?.title}
            </Button>
          )}
        </div>
      </section>
      <h2 className="wb-section-title">Pinned tools</h2>
      <div className="wb-tool-grid">
        {PINNED.map((id) => {
          const tool = getSpec(id);
          if (!tool) return null;
          const ToolIcon = tool.icon;
          return (
            <Button
              key={id}
              type="button"
              variant="ghost"
              className="wb-tool-tile text-left justify-start h-auto flex-col items-start"
              onClick={() => openTool(id)}
            >
              <ToolIcon size={30} />
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <IconArrowRight size={20} />
            </Button>
          );
        })}
      </div>
      <div className="wb-section-title-row">
        <h2>Continue a session</h2>
        <Button
          type="button"
          variant="link"
          className="wb-text-button p-0 h-auto"
          onClick={() => navigate('/saved')}
        >
          View Saved
          <IconArrowRight size={18} />
        </Button>
      </div>
      {sessions.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant="ghost"
          className="wb-list-row text-left justify-start h-auto w-full"
          onClick={() => restore(item)}
        >
          <IconBraces size={26} />
          <span>
            <strong>{item.name}</strong>
            <small>
              {getSpec(item.toolId)?.title ?? 'Tool'} ·{' '}
              {item.example ? 'Example session' : 'Saved in this session'}
            </small>
          </span>
          <IconArrowRight size={20} />
        </Button>
      ))}
    </>
  );
}
