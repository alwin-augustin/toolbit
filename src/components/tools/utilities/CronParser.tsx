import React, { useState } from 'react';
import cronParser from 'cron-parser';
import cronstrue from 'cronstrue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToolCard } from '@/components/ToolCard';
import { Clock } from 'lucide-react';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';

const CronParser: React.FC = () => {
  const [expression, setExpression] = useState('* * * * *');
  const [output, setOutput] = useState('');
  const [description, setDescription] = useState('');
  const { getShareUrl } = useUrlState(expression, setExpression);
  const { addEntry } = useToolHistory('cron-parser', 'Cron Parser');

  const handleParse = () => {
    try {
      // Get human-readable description
      const humanReadable = cronstrue.toString(expression);
      setDescription(humanReadable);

      // Parse and get next execution dates
      const interval = cronParser.parseExpression(expression);
      const nextDates = [];
      for (let i = 0; i < 5; i++) {
        nextDates.push(interval.next().toString());
      }
      setOutput(`Next 5 execution times:\n${nextDates.join('\n')}`);
      addEntry({
        input: expression,
        output: nextDates.join('\n'),
        metadata: { action: 'parse' },
      });
    } catch (err) {
      if (err instanceof Error) {
        setOutput(`Error: ${err.message}`);
        setDescription('');
      } else {
        setOutput(`An unknown error occurred`);
        setDescription('');
      }
    }
  };

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
          setExpression(entry.input || '* * * * *');
          setOutput(entry.output || '');
        },
      }}
    >
      <div className="flex gap-2 mb-2">
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter cron expression (e.g., * * * * *)"
          data-testid="cron-input"
        />
        <Button onClick={handleParse} data-testid="parse-button">Parse</Button>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        <span className="text-xs text-muted-foreground py-1">Examples:</span>
        {([
          { label: "Every minute", value: "* * * * *" },
          { label: "Hourly", value: "0 * * * *" },
          { label: "Daily midnight", value: "0 0 * * *" },
          { label: "Weekly Mon 9am", value: "0 9 * * 1" },
          { label: "Monthly 1st", value: "0 0 1 * *" },
          { label: "Weekdays 8am", value: "0 8 * * 1-5" },
        ] as const).map(ex => (
          <button
            key={ex.value}
            className="text-xs px-2 py-1 rounded border bg-muted/50 hover:bg-muted transition-colors"
            onClick={() => setExpression(ex.value)}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {description && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
          <h3 className="font-semibold text-sm mb-1 text-blue-900 dark:text-blue-100">Description</h3>
          <p className="text-sm text-blue-800 dark:text-blue-200" data-testid="cron-description">{description}</p>
        </div>
      )}

      <Textarea value={output} readOnly className="min-h-[24rem] font-mono text-sm" data-testid="cron-output" />
    </ToolCard>
  );
};

export default CronParser;
