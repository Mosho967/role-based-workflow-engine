import { useState, useRef, useEffect } from "react"
import { chatWithAI, applyWorkflow } from "../api/ai"

const GREETING = "Hi! I'm Cogsy. Describe your workflow and I'll design it, or ask me anything about workflow design."

function renderMessage(text) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />
    const parts = line.split(/\*\*(.+?)\*\*/g)
    return (
      <div key={i}>
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
      </div>
    )
  })
}

export default function MascotChat({ workflowId, states, transitions, onGenerated }) {
  const historyRef = useRef({})
  const pendingRef = useRef({})
  const loadedRef = useRef(false)
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING }])
  const [input, setInput] = useState("")
  const [mascotState, setMascotState] = useState("idle")
  const [loading, setLoading] = useState(false)
  const [pendingWorkflow, setPendingWorkflow] = useState(null)
  const messagesRef = useRef(null)

  useEffect(() => {
    loadedRef.current = false
    const saved = historyRef.current[workflowId]
      ?? JSON.parse(localStorage.getItem(`cogsy_history_${workflowId}`) || "null")
    setMessages(saved ?? [{ role: "assistant", text: GREETING }])
    setMascotState("idle")
  }, [workflowId])

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      return
    }
    historyRef.current[workflowId] = messages
    localStorage.setItem(`cogsy_history_${workflowId}`, JSON.stringify(messages))
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: userMsg }])
    setLoading(true)
    setMascotState("think")

    try {
      const history = messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role, content: m.text }))
      const res = await chatWithAI(workflowId, userMsg, states, transitions, history)
      if (res.preview) {
        setMessages(prev => [...prev, { role: "preview", text: res.message }])
        setMascotState("idle")
      } else if (res.warn) {
        setPendingWorkflow({ states: res.pending_states, transitions: res.pending_transitions })
        setMessages(prev => [...prev, { role: "warn", text: res.message }])
        setMascotState("idle")
      } else if (res.generated) {
        setMessages(prev => [...prev, { role: "assistant", text: res.message }])
        onGenerated(res.states, res.transitions)
        setMascotState("cheer")
        setTimeout(() => setMascotState("idle"), 5000)
      } else {
        setMessages(prev => [...prev, { role: "assistant", text: res.message }])
        setMascotState("idle")
      }
    } catch {
      setMessages(prev => [...prev, { role: "error", text: "Something went wrong. Please try again." }])
      setMascotState("idle")
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!pendingWorkflow) return
    setPendingWorkflow(null)
    setLoading(true)
    setMascotState("think")
    try {
      const res = await applyWorkflow(workflowId, pendingWorkflow.states, pendingWorkflow.transitions)
      onGenerated(res.states, res.transitions)
      setMessages(prev => [...prev, { role: "assistant", text: "Applied. Workflow updated." }])
      setMascotState("cheer")
      setTimeout(() => setMascotState("idle"), 5000)
    } catch {
      setMessages(prev => [...prev, { role: "error", text: "Failed to apply. Please try again." }])
      setMascotState("idle")
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setPendingWorkflow(null)
    setMessages(prev => [...prev, { role: "assistant", text: "Cancelled. No changes made." }])
  }

  function handlePreviewConfirm() {
    setInput("Yes, go ahead and build it")
    setTimeout(() => {
      setInput("")
      const userMsg = "Yes, go ahead and build it"
      setMessages(prev => [...prev, { role: "user", text: userMsg }])
      setLoading(true)
      setMascotState("think")
      const history = messages
        .filter(m => m.role === "user" || m.role === "assistant" || m.role === "preview")
        .map(m => ({ role: m.role === "preview" ? "assistant" : m.role, content: m.text }))
      chatWithAI(workflowId, userMsg, states, transitions, history).then(res => {
        if (res.generated) {
          setMessages(prev => [...prev, { role: "assistant", text: res.message }])
          onGenerated(res.states, res.transitions)
          setMascotState("cheer")
          setTimeout(() => setMascotState("idle"), 5000)
        } else {
          setMessages(prev => [...prev, { role: "assistant", text: res.message }])
          setMascotState("idle")
        }
      }).catch(() => {
        setMessages(prev => [...prev, { role: "error", text: "Something went wrong. Please try again." }])
        setMascotState("idle")
      }).finally(() => setLoading(false))
    }, 0)
  }

  function handlePreviewReject() {
    setMessages(prev => [...prev, { role: "user", text: "No, I'd like to change something." }])
    setMessages(prev => [...prev, { role: "assistant", text: "No problem — what would you like to adjust?" }])
  }

  return (
    <div className="bg-white rounded shadow flex flex-col" style={{ height: 580 }}>
      <div className="flex flex-col items-center py-3 border-b bg-gray-50 rounded-t">
        <img
          src={`/mascots/${mascotState}.gif`}
          alt="Cogsy"
          className="w-20 h-20 object-contain"
        />
        <p className="text-xs font-semibold text-gray-500 mt-1">Cogsy · AI Assistant</p>
      </div>

      <div ref={messagesRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "preview" ? (
              <div className="message-bounce rounded-2xl px-3 py-2 text-sm max-w-[90%] leading-relaxed bg-blue-50 border border-blue-200 text-blue-900">
                {renderMessage(m.text)}
                {i === messages.length - 1 && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handlePreviewConfirm}
                      disabled={loading}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-40"
                    >Yes, build it</button>
                    <button
                      onClick={handlePreviewReject}
                      disabled={loading}
                      className="text-blue-700 px-3 py-1 rounded-lg text-xs font-medium hover:underline disabled:opacity-40"
                    >No, change something</button>
                  </div>
                )}
              </div>
            ) : m.role === "error" ? (
              <div className="message-bounce rounded-2xl px-3 py-2 text-sm max-w-[90%] leading-relaxed bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
                <span className="flex-1">{m.text}</span>
                <button
                  onClick={() => setMessages(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 font-bold text-base leading-none mt-0.5"
                >×</button>
              </div>
            ) : m.role === "warn" ? (
              <div className="message-bounce rounded-2xl px-3 py-2 text-sm max-w-[90%] leading-relaxed bg-yellow-50 border border-yellow-300 text-yellow-900">
                {renderMessage(m.text)}
                {i === messages.length - 1 && pendingWorkflow && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleConfirm}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-yellow-600"
                    >Apply anyway</button>
                    <button
                      onClick={handleCancel}
                      className="text-yellow-700 px-3 py-1 rounded-lg text-xs font-medium hover:underline"
                    >Cancel</button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`message-bounce rounded-2xl px-3 py-2 text-sm max-w-[90%] leading-relaxed ${m.role === "user" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                {m.role === "assistant" ? renderMessage(m.text) : m.text}
              </div>
            )}
          </div>

        ))}
      </div>

      <div className="border-t p-3 flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
          placeholder="Ask Cogsy..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !loading && handleSend()}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-900 transition-colors"
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  )
}
