import React, { useState } from 'react';
import cronParser from 'cron-parser';
import cronstrue from 'cronstrue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToolCard } from '@/components/ToolCard';
import { Clock } from 'lucide-react';

const CronParser: React.FC = () => {
  const [expression, setExpression] = useState('* * * * *');
  const [output, setOutput] = useState('');
  const [description, setDescription] = useState('');

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
    >
      <div className="flex gap-2 mb-4">
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter cron expression (e.g., * * * * *)"
          data-testid="cron-input"
        />
        <Button onClick={handleParse} data-testid="parse-button">Parse</Button>
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