import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { fetchTask, sendComment } from "../api/tasks"
import { fetchStates, fetchTransitions, triggerTransition } from "../api/workflows"
import { fetchAuditLogsForTask, fetchUsers } from "../api/admin"
import { getRole } from "../services/authStorage"

export function useTaskDetail(taskId) {
  const [task, setTask] = useState(null)
  const [states, setStates] = useState([])
  const [transitions, setTransitions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const role = getRole()

  useEffect(() => { if (taskId) loadData() }, [taskId])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(""), 4000)
    return () => clearTimeout(timer)
  }, [error])

  async function loadData() {
    setLoading(true)
    try {
      const taskData = await fetchTask(taskId)
      setTask(taskData)

      const [s, tr, logs] = await Promise.all([
        fetchStates(taskData.workflow_id),
        fetchTransitions(taskData.workflow_id),
        fetchAuditLogsForTask(taskId),
      ])
      setStates(s)
      setTransitions(tr)
      setAuditLogs(logs)

      try {
        const userData = await fetchUsers()
        setUsers(userData)
      } catch {
        // not available for all roles
      }
    } catch {
      setError("Failed to load task")
    } finally {
      setLoading(false)
    }
  }

  async function handleTriggerTransition(toStateId, comment) {
    setError("")
    try {
      const updated = await triggerTransition(taskId, toStateId, comment)
      setTask(updated)
      const logs = await fetchAuditLogsForTask(taskId)
      setAuditLogs(logs)
    } catch (err) {
      setError(err.response?.data?.detail || "Transition failed")
    }
  }

  function getStateName(stateId) {
    return states.find((s) => s.id === stateId)?.name || "Unknown"
  }

  function isStateFinal(stateId) {
    return states.find((s) => s.id === stateId)?.is_final ?? false
  }

  function getAvailableTransitions() {
    if (!task) return []
    if (isStateFinal(task.current_state_id)) return []
    return transitions.filter(
      (t) => t.from_state_id === task.current_state_id && t.required_role === role
    )
  }

  function getOrderedStates() {
    const initial = states.find((s) => s.is_initial)
    if (!initial) return states
    const ordered = [initial]
    const visited = new Set([initial.id])
    let current = initial
    while (true) {
      const next = transitions.find((t) => t.from_state_id === current.id && !visited.has(t.to_state_id))
      if (!next) break
      const nextState = states.find((s) => s.id === next.to_state_id)
      if (!nextState) break
      ordered.push(nextState)
      visited.add(nextState.id)
      current = nextState
    }
    return ordered
  }

  async function handleSendComment(comment) {
    setError("")
    try {
      const log = await sendComment(taskId, comment)
      setAuditLogs((prev) => [...prev, log])
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send message")
    }
  }

  function getUserName(userId) {
    return users.find((u) => u.id === userId)?.username || null
  }

  return {
    task,
    states,
    auditLogs,
    error,
    loading,
    role,
    handleTriggerTransition,
    handleSendComment,
    getStateName,
    isStateFinal,
    getAvailableTransitions,
    getOrderedStates,
    getUserName,
  }
}
