import type { ReactNode } from "react";
import {
    FileJson,
    Lock,
    Wand2,
    ArrowLeftRight,
    Microscope,
    Hammer,
    FileText,
} from "lucide-react";
import type { ToolCategory } from "@/config/tools.config";

export interface CategoryMeta {
    id: ToolCategory;
    label: string;
    icon: (size?: number) => ReactNode;
}

export const CATEGORIES: CategoryMeta[] = [
    { id: "format", label: "Format & Validate", icon: (s = 15) => <FileJson size={s} /> },
    { id: "encode", label: "Encode & Decode", icon: (s = 15) => <Lock size={s} /> },
    { id: "generate", label: "Generate", icon: (s = 15) => <Wand2 size={s} /> },
    { id: "transform", label: "Transform", icon: (s = 15) => <ArrowLeftRight size={s} /> },
    { id: "analyze", label: "Analyze", icon: (s = 15) => <Microscope size={s} /> },
    { id: "build", label: "Build", icon: (s = 15) => <Hammer size={s} /> },
    { id: "text", label: "Text & Docs", icon: (s = 15) => <FileText size={s} /> },
];

export function categoryMeta(id: string): CategoryMeta | undefined {
    return CATEGORIES.find((c) => c.id === id);
}
