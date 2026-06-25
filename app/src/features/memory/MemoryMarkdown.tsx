import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MemoryMarkdown({ children }: { children: string }) {
  return (
    <div className="memory-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
