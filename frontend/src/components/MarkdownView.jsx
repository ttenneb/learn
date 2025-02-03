import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import YouTubeEmbed from './YouTubeEmbed';
import 'katex/dist/katex.min.css';
import PropTypes from 'prop-types';

const MarkdownView = ({ content }) => {
  const components = {
    h1: ({children}) => (
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4">
        {children}
      </h1>
    ),
    h2: ({children}) => (
      <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-8 mb-3">
        {children}
      </h2>
    ),
    h3: ({children}) => (
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-6 mb-2">
        {children}
      </h3>
    ),
    p: ({ children, ...props }) => {
      if (children?.[0]?.startsWith?.('youtube:')) {
        const videoId = children[0].split('youtube:')[1].trim();
        return (
          <div className="my-6 w-full">
            <YouTubeEmbed videoId={videoId} />
          </div>
        );
      }
      return (
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4" {...props}>
          {children}
        </p>
      );
    },
    ul: ({children}) => (
      <ul className="list-disc ml-6 my-4 text-gray-600 dark:text-gray-400">
        {children}
      </ul>
    ),
    ol: ({children}) => (
      <ol className="list-decimal ml-6 my-4 text-gray-600 dark:text-gray-400">
        {children}
      </ol>
    ),
    li: ({children}) => (
      <li className="my-1 text-gray-600 dark:text-gray-400">
        {children}
      </li>
    ),
    code: ({inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match && match[1];

      if (inline) {
        return (
          <code className={`bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 ${className}`} {...props}>
            {children}
          </code>
        );
      }

      if (lang === 'math') {
        return (
          <div className="my-4 overflow-x-auto">
            {children}
          </div>
        );
      }

      return (
        <pre className={className} {...props}>
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="w-full">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

MarkdownView.propTypes = {
  content: PropTypes.string.isRequired,
};

export default MarkdownView;

