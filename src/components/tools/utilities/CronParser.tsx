import React, { useState, useEffect } from 'react';
import cronParser from 'cron-parser';
import cronstrue from 'cronstrue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolCard } from '@/components/ToolCard';
import { Clock, Keyboard } from 'lucide-react';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';

const PRESETS = [
  { label: "Every minute", value: "* * * * *", desc: "Runs every single minute" },
  { label: "Every 5 min", value: "*/5 * * * *", desc: "Runs every 5 minutes" },
  { label: "Hourly", value: "0 * * * *", desc: "At minute 0 of every hour" },
  { label: "Daily midnight", value: "0 0 * * *", desc: "Once a day at 00:00" },
  { label: "Weekly Mon 9am", value: "0 9 * * 1", desc: "Every Monday at 9:00 AM" },
  { label: "Monthly 1st", value: "0 0 1 * *", desc: "First day of every month" },
  { label: "Weekdays 8am", value: "0 8 * * 1-5", desc: "Mon-Fri at 8:00 AM" },
  { label: "Every 15 min", value: "*/15 * * * *", desc: "Every quarter hour" },
  { label: "Twice daily", value: "0 9,18 * * *", desc: "At 9:00 AM and 6:00 PM" },
] as const;

const FIELD_LABELS = ["Minute", "Hour", "Day", "Month", "Weekday"];

const CronParser: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [description, setDescription] = useState('');
  const [nextDates, setNextDates] = useState<string[]>([]);
  const [error, setError] = useState('');
  const { getShareUrl } = useUrlState(expression, setExpression);
  const { addEntry } = useToolHistory('cron-parser', 'Cron Parser');

  // Consume smart-paste data from AppHome
  useEffect(() => {
    const smartPaste = sessionStorage.getItem("toolbit:smart-paste");
    if (smartPaste) {
      sessionStorage.removeItem("toolbit:smart-paste");
      setExpression(smartPaste.trim());
    }
  }, []);

  // Auto-parse on expression change
  useEffect(() => {
    if (!expression.trim()) {
      setDescription('');
      setNextDates([]);
      setError('');
      return;
    }

    try {
      const humanReadable = cronstrue.toString(expression);
      setDescription(humanReadable);

      const interval = cronParser.parseExpression(expression);
      const dates = [];
      for (let i = 0; i < 5; i++) {
        dates.push(interval.next().toDate().toLocaleString());
      }
      setNextDates(dates);
      setError('');
      addEntry({
        input: expression,
        output: dates.join('\n'),
        metadata: { action: 'parse' },
      });
    } catch (err) {
      setDescription('');
      setNextDates([]);
      setError(err instanceof Error ? err.message : 'Invalid cron expression');
    }
  }, [expression]);

  const fields = expression.trim().split(/\s+/);

  return (
    <ToolCard
      title="Cron Expression Parser"
      description="Parse cron expressions and see upcoming execution dates"
      icon={<Clock className="h-5 w-5" />}
      shareUrl={getShareUrl()}
      history={{
        toolId: 'cron-parser',
        toolName: 'Cron Parser',
        onRestore: (entry) => {
          setExpression(entry.input || '');
        },
      }}
    >
      {/* Input */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Cron Expression</label>
          <Input
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="* * * * *"
            className="font-mono text-base"
            data-testid="cron-input"
          />
        </div>

        {/* Visual field labels */}
        {fields.length >= 5 && !error && expression.trim() && (
          <div className="flex gap-2 flex-wrap">
            {fields.slice(0, 5).map((field, i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-2 rounded-md bg-muted/60 border border-border min-w-[72px]">
                <span className="font-mono text-sm font-semibold">{field}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{FIELD_LABELS[i]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-base font-medium text-foreground" data-testid="cron-description">{description}</p>
          </div>
        )}

        {/* Error */}
        {error && expression.trim() && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Next execution dates */}
        {nextDates.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Next 5 executions</h3>
            <div className="space-y-1">
              {nextDates.map((date, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md bg-card border border-border text-sm font-mono">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span>{date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preset patterns — shown prominently when no input */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{expression.trim() ? 'Common patterns' : 'Start with a pattern'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.value}
                className="text-left p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all group"
                onClick={() => setExpression(preset.value)}
              >
                <div className="font-mono text-sm text-primary group-hover:text-primary">{preset.value}</div>
                <div className="text-xs font-medium mt-0.5">{preset.label}</div>
                <div className="text-[11px] text-muted-foreground">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* What you can do — shown when empty */}
        {!expression.trim() && (
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground/60">
            <Keyboard className="h-3 w-3" />
            <span>Type a cron expression above or click a pattern to get started</span>
          </div>
        )}
      </div>
    </ToolCard>
  );
};

export default CronParser;
