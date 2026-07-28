import type { JSONContent } from "@tiptap/react";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import type { ComponentType } from "react";
import { MathFormula } from "@/components/content/math-formula";
import { extensions } from "@/features/posts/editor/config";

interface RenderSlots {
  CodeBlock: ComponentType<{
    code: string;
    language: string | null;
    highlightedHtml?: string;
  }>;
  ImageDisplay: ComponentType<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
}

/**
 * 共享的 Tiptap JSON → React 渲染管线。
 * 每个 theme 传入自己的 CodeBlock 和 ImageDisplay 叶子组件；
 * 其余节点映射（表格、数学公式等）在所有 theme 中通用。
 */
export function createRenderReact(slots: RenderSlots) {
  const { CodeBlock, ImageDisplay } = slots;

  return function renderReact(content: JSONContent) {
    return renderToReactElement({
      extensions,
      content,
      options: {
        nodeMapping: {
          image: ({ node }) => {
            const attrs = node.attrs as {
              src: string;
              alt?: string | null;
              width?: number | string;
              height?: number | string;
            };

            const alt =
              (attrs.alt && attrs.alt !== "null" ? attrs.alt : null) ||
              "blog image";

            const width =
              typeof attrs.width === "string"
                ? parseInt(attrs.width)
                : attrs.width;
            const height =
              typeof attrs.height === "string"
                ? parseInt(attrs.height)
                : attrs.height;

            return (
              <ImageDisplay
                src={attrs.src}
                alt={alt}
                width={width || undefined}
                height={height || undefined}
              />
            );
          },
          codeBlock: ({ node }) => {
            const code = node.textContent || "";
            const attrs = node.attrs as {
              language?: string | null;
              highlightedHtml?: string;
            };

            return (
              <CodeBlock
                code={code}
                language={attrs.language || null}
                highlightedHtml={attrs.highlightedHtml}
              />
            );
          },
          tableCell: ({ node, children }) => {
            const attrs = node.attrs as {
              colspan?: number;
              rowspan?: number;
              colwidth?: Array<number>;
              style?: string;
            };
            return (
              <td
                colSpan={attrs.colspan}
                rowSpan={attrs.rowspan}
                style={attrs.style ? { width: attrs.style } : undefined}
              >
                {children}
              </td>
            );
          },
          tableHeader: ({ node, children }) => {
            const attrs = node.attrs as {
              colspan?: number;
              rowspan?: number;
              colwidth?: Array<number>;
              style?: string;
            };
            return (
              <th
                colSpan={attrs.colspan}
                rowSpan={attrs.rowspan}
                style={attrs.style ? { width: attrs.style } : undefined}
              >
                {children}
              </th>
            );
          },
          inlineMath: ({ node }) => {
            const latex = (node.attrs as { latex?: string }).latex ?? "";
            return <MathFormula latex={latex} mode="inline" />;
          },
          blockMath: ({ node }) => {
            const latex = (node.attrs as { latex?: string }).latex ?? "";
            return <MathFormula latex={latex} mode="block" />;
          },
        },
      },
    });
  };
}
