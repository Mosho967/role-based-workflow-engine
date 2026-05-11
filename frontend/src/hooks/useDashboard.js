import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { fetchTasks, createTask, deleteTask } from "../api/tasks"
import { fetchWorkflows, fetchStates, fetchTransitions, triggerTransition } from "../api/workflows"
import { fetchAuditLogsForTask } from "../api/admin"
import { clearAuth, getRole, getUsername } from "../services/authStorage"

export function useDashboard() {
  const [tasks, setTasks] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [states, setStates] = useState({})
  const [transitions, setTransitions] = useState({})
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [error, setError] = useState("")
  const [auditLogs, setAuditLogs] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const role = getRole()
  const username = getUsername()

  useEffect(() => {
    loadData()
  }, [])

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

      // Fetch states per workflow to resolve state names from IDs
      const stateMap = {}
      await Promise.all(
        workflowData.map(async (wf) => {
          const wfStates = await fetchStates(wf.id)
          stateMap[wf.id] = wfStates
        })
      )
      setStates(stateMap)

      const logMap = {}
      await Promise.all(
        taskData.map(async (task) => {
          const logs = await fetchAuditLogsForTask(task.id)
          logMap[task.id] = logs
        })
      )
      setAuditLogs(logMap)
    } catch (err) {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  async function loadTransitions(workflowId) {
    if (transitions[workflowId]) return
    try {
      const data = await fetchTransitions(workflowId)
      setTransitions((prev) => ({ ...prev, [workflowId]: data }))
    } catch {
      // transitions will not render if fetch fails
    }
  }

  async function handleSubmitTask(e) {
    e.preventDefault()
    setError("")
    if (!selectedWorkflowId) {
      setError("Please select a workflow")
      return
    }
    try {
      const task = await createTask(newTaskTitle, selectedWorkflowId, newTaskDescription)
      setTasks((prev) => [...prev, task])
      setNewTaskTitle("")
      setNewTaskDescription("")
      setSelectedWorkflowId("")
      if (!states[selectedWorkflowId]) {
        const wfStates = await fetchStates(selectedWorkflowId)
        setStates(prev => ({ ...prev, [selectedWorkflowId]: wfStates }))
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg.replace(/^Value error, /i, '')).join(', '))
      } else {
        setError(detail || "Failed to create task")
      }
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

  async function handleDeleteTask(taskId) {
    setError("")
    try {
      await deleteTask(taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete task")
    }
  }

  function handleLogout() {
    clearAuth()
    navigate("/login")
  }

  function getStateName(workflowId, stateId) {
    const wfStates = states[workflowId] || []
    const state = wfStates.find((s) => s.id === stateId)
    return state ? state.name : "Unknown"
  }

  function getWorkflowName(workflowId) {
    const wf = workflows.find((w) => w.id === workflowId)
    return wf ? wf.name : "Unknown"
  }

  function getAvailableTransitions(workflowId, currentStateId) {
    if (isStateFinal(workflowId, currentStateId)) return []
    const wfTransitions = transitions[workflowId] || []
    return wfTransitions.filter(
      (t) => t.from_state_id === currentStateId && t.required_role === role
    )
  }

  function isStateFinal(workflowId, stateId) {
    const wfStates = states[workflowId] || []
    const state = wfStates.find((s) => s.id === stateId)
    return state ? state.is_final : false
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

  return {
    tasks,
    workflows,
    auditLogs,
    selectedWorkflowId,
    setSelectedWorkflowId,
    newTaskTitle,
    setNewTaskTitle,
    newTaskDescription,
    setNewTaskDescription,
    error,
    loading,
    role,
    username,
    handleSubmitTask,
    handleTriggerTransition,
    handleLogout,
    getStateName,
    getWorkflowName,
    getAvailableTransitions,
    isStateFinal,
    getOrderedStates,
    handleDeleteTask,
    loadTransitions,
  }
}
