import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { ToolHistory } from "@/components/ToolHistory";
import { type ToolHistoryEntry } from "@/lib/history-db";
import { useLocation } from "wouter";
import { TOOLS } from "@/config/tools.config";
import { getChainTargets } from "@/config/tool-chains.config";
import { useToolPipe } from "@/hooks/use-tool-pipe";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  shareUrl?: string;
  history?: {
    toolId: string;
    toolName: string;
    onRestore: (entry: ToolHistoryEntry) => void;
  };
  pipeSource?: {
    toolId: string;
    output: string;
  };
}

export function ToolCard({ title, description, icon, children, shareUrl, history, pipeSource }: ToolCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { setPipeData } = useToolPipe();

  const handleShare = () => {
    const url = shareUrl || window.location.href;
    navigator.clipboard.writeText(url);
    toast({ description: "Link copied to clipboard!" });
  };

  const chainTargets = pipeSource ? getChainTargets(pipeSource.toolId) : [];
  const chainTools = chainTargets
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <Card className="h-full shadow-sm border-border/50 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {pipeSource && pipeSource.output && chainTools.length > 0 && (
              <div className="flex items-center gap-1">
                <Send className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  onChange={(e) => {
                    const targetId = e.target.value;
                    const target = TOOLS.find((t) => t.id === targetId);
                    if (!target) return;
                    setPipeData(pipeSource.output, pipeSource.toolId);
                    setLocation(target.path);
                    e.currentTarget.selectedIndex = 0;
                  }}
                >
                  <option value="">Send to…</option>
                  {chainTools.map((tool) => (
                    <option key={tool!.id} value={tool!.id}>
                      {tool!.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {history && (
              <ToolHistory
                toolId={history.toolId}
                toolName={history.toolName}
                onRestore={history.onRestore}
              />
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} title="Share this tool">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}
