import type { JSONContent } from "@tiptap/react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { renderReact } from "./render";

interface ContentRendererProps {
  content: JSONContent | null;
  className?: string;
}

export function ContentRenderer({ content, className }: ContentRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return null;
    return renderReact(content);
  }, [content]);

  if (!content) return null;

  return <div className={cn("ProseMirror", className)}>{renderedContent}</div>;
}
