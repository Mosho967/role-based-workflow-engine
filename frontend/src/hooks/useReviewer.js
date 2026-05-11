import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { fetchTasks } from "../api/tasks"
import { fetchWorkflows, fetchStates, fetchTransitions, triggerTransition } from "../api/workflows"
import { fetchAuditLogsForTask, fetchUsers } from "../api/admin"
import { clearAuth, getRole, getUsername } from "../services/authStorage"

export function useReviewer() {
  const [tasks, setTasks] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [states, setStates] = useState({})
  const [transitions, setTransitions] = useState({})
  const [auditLogs, setAuditLogs] = useState({})
  const [users, setUsers] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const role = getRole()
  const username = getUsername()

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(""), 4000)
    return () => clearTimeout(timer)
  }, [error])

  async function loadData() {
    setLoading(true)
    try {
      const [taskData, workflowData] = await Promise.all([fetchTasks(), fetchWorkflows()])
      setTasks(taskData)
      setWorkflows(workflowData)

      const stateMap = {}
      const transitionMap = {}
      const uniqueWorkflowIds = [...new Set(taskData.map((t) => t.workflow_id))]
      await Promise.all(
        uniqueWorkflowIds.map(async (wfId) => {
          const [s, tr] = await Promise.all([fetchStates(wfId), fetchTransitions(wfId)])
          stateMap[wfId] = s
          transitionMap[wfId] = tr
        })
      )
      setStates(stateMap)
      setTransitions(transitionMap)

      const logMap = {}
      await Promise.all(
        taskData.map(async (task) => {
          const logs = await fetchAuditLogsForTask(task.id)
          logMap[task.id] = logs
        })
      )
      setAuditLogs(logMap)

      try {
        const userData = await fetchUsers()
        setUsers(userData)
      } catch {
        // users endpoint may not be accessible to reviewers — silently skip
      }
    } catch {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  async function handleTriggerTransition(taskId, toStateId, comment) {
    setError("")
    try {
      const updated = await triggerTransition(taskId, toStateId, comment)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      const logs = await fetchAuditLogsForTask(taskId)
      setAuditLogs((prev) => ({ ...prev, [taskId]: logs }))
    } catch (err) {
      setError(err.response?.data?.detail || "Transition failed")
    }
  }

  function handleLogout() {
    clearAuth()
    navigate("/login")
  }

  function getStateName(workflowId, stateId) {
    return states[workflowId]?.find((s) => s.id === stateId)?.name || "Unknown"
  }

  function getWorkflowName(workflowId) {
    return workflows.find((w) => w.id === workflowId)?.name || "Unknown"
  }

  function isStateFinal(workflowId, stateId) {
    return states[workflowId]?.find((s) => s.id === stateId)?.is_final ?? false
  }

  function getAvailableTransitions(workflowId, currentStateId) {
    if (isStateFinal(workflowId, currentStateId)) return []
    return (transitions[workflowId] || []).filter(
      (t) => t.from_state_id === currentStateId && t.required_role === "reviewer"
    )
  }

  function getOrderedStates(workflowId) {
    const wfStates = states[workflowId] || []
    const wfTransitions = transitions[workflowId] || []
    const initial = wfStates.find((s) => s.is_initial)
    if (!initial) return wfStates
    const ordered = [initial]
    const visited = new Set([initial.id])
    let current = initial
    while (true) {
      const next = wfTransitions.find((t) => t.from_state_id === current.id && !visited.has(t.to_state_id))
      if (!next) break
      const nextState = wfStates.find((s) => s.id === next.to_state_id)
      if (!nextState) break
      ordered.push(nextState)
      visited.add(nextState.id)
      current = nextState
    }
    return ordered
  }

  function getSubmitterName(userId) {
    return users.find((u) => u.id === userId)?.username || null
  }

  return {
    tasks,
    auditLogs,
    error,
    loading,
    role,
    username,
    handleTriggerTransition,
    handleLogout,
    loadData,
    getStateName,
    getWorkflowName,
    isStateFinal,
    getAvailableTransitions,
    getOrderedStates,
    getSubmitterName,
  }
}
