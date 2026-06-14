import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { fetchTask, sendComment } from "../api/tasks"
import { fetchStates, fetchTransitions, triggerTransition } from "../api/workflows"
import { fetchAuditLogsForTask, fetchUsers } from "../api/admin"
import { getRole } from "../services/authStorage"
import { getStateName as wfGetStateName, isStateFinal as wfIsStateFinal, getAvailableTransitions as wfGetAvailableTransitions, getOrderedStates as wfGetOrderedStates } from "../utils/workflowUtils"

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
    return wfGetStateName(states, stateId)
  }

  function isStateFinal(stateId) {
    return wfIsStateFinal(states, stateId)
  }

  function getAvailableTransitions() {
    if (!task) return []
    return wfGetAvailableTransitions(transitions, states, task.current_state_id, role)
  }

  function getOrderedStates() {
    return wfGetOrderedStates(states, transitions)
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
