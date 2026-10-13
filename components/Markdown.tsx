import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

const sanitizeSchema = {
  ...(defaultSchema as Record<string, unknown>),
  tagNames: [
    ...((defaultSchema as { tagNames?: string[] }).tagNames ?? []),
    "del",
    "ins",
    "kbd",
    "sup",
    "sub",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "details",
    "summary",
  ],
  attributes: {
    ...((defaultSchema as { attributes?: Record<string, unknown> }).attributes ?? {}),
    code: [["className"]],
    span: [["className"]],
    input: [["type", "checked", "disabled"]],
    a: [["href", "title"]],
    img: [["src", "alt", "title", "width", "height"]],
  },
};

export default function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("md-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, { schema: sanitizeSchema }],
          rehypeHighlight,
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}