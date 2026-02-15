import { useState, useCallback, useRef, useEffect } from 'react'
import { useAI } from '../../hooks/useAI'
import { generateText } from '../../services/ai/llmService'
import { ModelDownload } from './ModelDownload'
import './InsightsView.css'

function truncateContent(content, maxChars = 4000) {
  if (typeof content === 'string') {
    return content.length > maxChars ? content.slice(0, maxChars) + '\n...[truncated]' : content
  }
  const text = JSON.stringify(content, null, 2)
  return text.length > maxChars ? text.slice(0, maxChars) + '\n...[truncated]' : text
}

function StreamingOutput({ text, isGenerating }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current && isGenerating) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [text, isGenerating])

  return (
    <div className="ai-streaming-output" ref={containerRef}>
      <div className="ai-streaming-text">
        {text}
        {isGenerating && <span className="ai-streaming-cursor" />}
      </div>
    </div>
  )
}

export function InsightsView({ fileData, fileType, filename }) {
  const { isLLMReady, llmStatus } = useAI()
  const [activeAction, setActiveAction] = useState(null) // 'summarize' | 'qa'
  const [streamingText, setStreamingText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [question, setQuestion] = useState('')
  const [error, setError] = useState(null)
  const abortRef = useRef(false)

  const handleSummarize = useCallback(async () => {
    if (!fileData || isGenerating) return
    abortRef.current = false
    setActiveAction('summarize')
    setStreamingText('')
    setIsGenerating(true)
    setError(null)

    const content = truncateContent(fileData)
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that analyzes file contents. Provide concise, structured summaries.',
      },
      {
        role: 'user',
        content: `Summarize this ${fileType || 'text'} file "${filename || 'untitled'}":\n\n${content}`,
      },
    ]

    try {
      await generateText(messages, (delta, full) => {
        if (!abortRef.current) setStreamingText(full)
      })
    } catch (err) {
      if (!abortRef.current) setError(err.message)
    } finally {
      if (!abortRef.current) setIsGenerating(false)
    }
  }, [fileData, fileType, filename, isGenerating])

  const handleAsk = useCallback(async () => {
    if (!fileData || !question.trim() || isGenerating) return
    abortRef.current = false
    setActiveAction('qa')
    setStreamingText('')
    setIsGenerating(true)
    setError(null)

    const content = truncateContent(fileData)
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that answers questions about file contents. Be concise and accurate.',
      },
      {
        role: 'user',
        content: `Here is the content of "${filename || 'untitled'}" (${fileType || 'text'} file):\n\n${content}\n\nQuestion: ${question}`,
      },
    ]

    try {
      await generateText(messages, (delta, full) => {
        if (!abortRef.current) setStreamingText(full)
      })
    } catch (err) {
      if (!abortRef.current) setError(err.message)
    } finally {
      if (!abortRef.current) setIsGenerating(false)
    }
  }, [fileData, fileType, filename, question, isGenerating])

  const handleStop = useCallback(() => {
    abortRef.current = true
    setIsGenerating(false)
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }, [handleAsk])

  if (!isLLMReady) {
    return (
      <div className="ai-insights-view">
        {llmStatus.status === 'loading' ? (
          <div className="ai-loading-state">
            <div className="ai-loading-spinner" />
            <p>{llmStatus.message}</p>
            {llmStatus.progress > 0 && (
              <div className="ai-progress-bar">
                <div className="ai-progress-fill" style={{ width: `${llmStatus.progress * 100}%` }} />
              </div>
            )}
          </div>
        ) : (
          <ModelDownload />
        )}
      </div>
    )
  }

  return (
    <div className="ai-insights-view">
      <div className="ai-insights-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSummarize}
          disabled={isGenerating || !fileData}
        >
          <i className="bi bi-card-text"></i>
          Summarize
        </button>
      </div>

      <div className="ai-insights-qa">
        <div className="ai-search-input-wrapper">
          <i className="bi bi-chat-dots"></i>
          <input
            className="ai-search-input"
            type="text"
            placeholder="Ask a question about this file..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />
          {question && !isGenerating && (
            <button className="ai-search-clear" onClick={() => setQuestion('')}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleAsk}
          disabled={isGenerating || !question.trim() || !fileData}
        >
          Ask
        </button>
      </div>

      {isGenerating && (
        <button className="btn btn-outline btn-sm ai-stop-btn" onClick={handleStop}>
          <i className="bi bi-stop-fill"></i> Stop
        </button>
      )}

      {error && (
        <div className="ai-error-state">
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      )}

      {streamingText && (
        <StreamingOutput text={streamingText} isGenerating={isGenerating} />
      )}

      {!streamingText && !isGenerating && !error && (
        <div className="ai-sidebar-empty">
          <i className="bi bi-lightbulb"></i>
          <p>Summarize this file or ask questions about its contents.</p>
        </div>
      )}
    </div>
  )
}
