import React, { useState } from 'react';
import cronParser from 'cron-parser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToolCard } from '@/components/ToolCard';
import { Clock } from 'lucide-react';

const CronParser: React.FC = () => {
  const [expression, setExpression] = useState('* * * * *');
  const [output, setOutput] = useState('');

  const handleParse = () => {
    try {
      const interval = cronParser.parseExpression(expression);
      const nextDates = [];
      for (let i = 0; i < 5; i++) {
        nextDates.push(interval.next().toString());
      }
      setOutput(`Next 5 dates:\n${nextDates.join('\n')}`);
    } catch (err) {
      if (err instanceof Error) {
        setOutput(`Error: ${err.message}`);
      } else {
        setOutput(`An unknown error occurred`);
      }
    }
  };

  return (
    <ToolCard
      title="Cron Expression Parser"
      description="Parse cron expressions and see upcoming execution dates"
      icon={<Clock className="h-5 w-5" />}
    >
      <div className="flex gap-2 mb-2">
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter cron expression"
          data-testid="cron-input"
        />
        <Button onClick={handleParse} data-testid="parse-button">Parse</Button>
      </div>
      <Textarea value={output} readOnly className="min-h-[24rem] font-mono text-sm" data-testid="cron-output" />
    </ToolCard>
  );
};

export default CronParser;