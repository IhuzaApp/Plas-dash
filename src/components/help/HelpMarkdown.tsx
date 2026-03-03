'use client';

import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface HelpMarkdownProps {
  content: string;
}

export default function HelpMarkdown({ content }: HelpMarkdownProps) {
  return (
    <Markdown
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const isJson = match && match[1] === 'json';
          const codeString = String(children).replace(/\n$/, '');

          if (!inline && isJson) {
            return <JsonCodeBlock code={codeString} />;
          }

          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </Markdown>
  );
}

function JsonCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="h-8 flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy JSON
            </>
          )}
        </Button>
      </div>
      <pre className="!bg-slate-950 !p-4 rounded-lg overflow-x-auto border border-slate-800 shadow-xl">
        <code className="language-json text-blue-300 font-mono text-sm leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
}
