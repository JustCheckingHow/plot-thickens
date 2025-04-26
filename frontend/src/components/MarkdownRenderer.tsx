import React from 'react';

type MarkdownRendererProps = {
  content: string;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return <div>{content}</div>;
};

export default MarkdownRenderer;