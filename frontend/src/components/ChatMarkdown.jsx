import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const ChatMarkdown = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <div className="my-4">
              <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                className="rounded-lg overflow-hidden"
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  backgroundColor: '#1e1e1e',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 font-mono text-sm" {...props}>
              {children}
            </code>
          );
        },
        // Enhanced markdown element styling
        p: ({ children }) => (
          <p className="text-lg leading-relaxed whitespace-pre-wrap my-4 text-gray-800 dark:text-gray-200">
            {children}
          </p>
        ),
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-medium mt-5 mb-2 text-gray-800 dark:text-gray-200">
            {children}
          </h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc marker:text-blue-500 dark:marker:text-blue-400 list-inside my-4 space-y-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal marker:text-blue-500 dark:marker:text-blue-400 list-inside my-4 space-y-2">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="ml-4 text-gray-800 dark:text-gray-200">
            {children}
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500/50 dark:border-blue-400/50 pl-4 my-4 italic bg-gray-50 dark:bg-gray-800/50 py-2 rounded-r-lg">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50 dark:bg-gray-800">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
            {children}
          </td>
        ),
        // Handle math blocks
        math: ({ value }) => (
          <div className="my-4 flex justify-center">
            <div className="katex-display">{value}</div>
          </div>
        ),
        inlineMath: ({ value }) => (
          <span className="katex-inline">{value}</span>
        ),
        // Add support for horizontal rules
        hr: () => (
          <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
        ),
        img: ({ src, alt, title }) => (
          <img
            src={src}
            alt={alt}
            title={title}
            className="my-4 rounded-lg max-w-full h-auto"
            loading="lazy"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

ChatMarkdown.propTypes = {
  content: PropTypes.string.isRequired,
};

export default ChatMarkdown;
