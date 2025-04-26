import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
}) => {
  return (
    <div className={cn("markdown-renderer prose prose-invert", className)}>
      {content.split('\n\n').map((paragraph, index) => (
        <>
          <ReactMarkdown key={index}>{paragraph}</ReactMarkdown>
          <br />
        </>
      ))}
    </div>
  );
};

export default MarkdownRenderer; 