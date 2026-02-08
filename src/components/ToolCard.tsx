import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, ArrowRight, X, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { ToolHistory } from "@/components/ToolHistory";
import { type ToolHistoryEntry } from "@/lib/history-db";
import { Link, useLocation } from "wouter";
import { TOOLS } from "@/config/tools.config";
import { getChainTargets } from "@/config/tool-chains.config";
import { useToolPipe } from "@/hooks/use-tool-pipe";
import { cn } from "@/lib/utils";

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
  const { setPipeData, addPipelineStep, pipeline, clearPipeline } = useToolPipe();
  const [showPipeMenu, setShowPipeMenu] = useState(false);

  const handleShare = () => {
    const url = shareUrl || window.location.href;
    navigator.clipboard.writeText(url);
    toast({ description: "Link copied to clipboard!" });
  };

  const chainTargets = pipeSource ? getChainTargets(pipeSource.toolId) : [];
  const chainTools = chainTargets
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter(Boolean);

  const handlePipe = (targetTool: typeof TOOLS[0]) => {
    if (!pipeSource) return;
    const sourceTool = TOOLS.find(t => t.id === pipeSource.toolId);
    if (sourceTool) {
      addPipelineStep({ toolId: sourceTool.id, toolName: sourceTool.name, path: sourceTool.path });
    }
    addPipelineStep({ toolId: targetTool.id, toolName: targetTool.name, path: targetTool.path });
    setPipeData(pipeSource.output, pipeSource.toolId);
    setLocation(targetTool.path);
    setShowPipeMenu(false);
  };

  const hasPipeOutput = pipeSource && pipeSource.output && chainTools.length > 0;

  return (
    <Card className="h-full shadow-sm border-border/50">
      {/* Pipeline breadcrumb trail */}
      {pipeline.length >= 2 && (
        <div className="flex items-center gap-1 px-6 pt-4 pb-0 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Pipeline:</span>
          {pipeline.map((step, i) => {
            const isCurrent = i === pipeline.length - 1;
            return (
              <React.Fragment key={step.toolId + i}>
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                <Link
                  href={step.path}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md transition-colors",
                    isCurrent
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {step.toolName}
                </Link>
              </React.Fragment>
            );
          })}
          <button
            onClick={clearPipeline}
            className="ml-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            title="Clear pipeline"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
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
      <CardContent className="space-y-6">
        {children}

        {/* Pipe to next tool — popover instead of native select */}
        {hasPipeOutput && (
          <div className="relative border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPipeMenu(!showPipeMenu)}
              className="gap-1.5"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Pipe output to...
            </Button>

            {showPipeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPipeMenu(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 z-50 w-64 bg-popover border border-border rounded-lg shadow-lg py-2 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="px-3 pb-1.5 text-xs font-medium text-muted-foreground">
                    Send output to
                  </div>
                  {chainTools.map((tool) => (
                    <button
                      key={tool!.id}
                      onClick={() => handlePipe(tool!)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                    >
                      <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                      <span>{tool!.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
