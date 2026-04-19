import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { fetchTasks, createTask } from "../api/tasks"
import { fetchWorkflows, fetchStates, fetchTransitions, triggerTransition } from "../api/workflows"
import { clearAuth, getRole } from "../services/authStorage"

export function useDashboard() {
  const [tasks, setTasks] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [states, setStates] = useState({})
  const [transitions, setTransitions] = useState({})
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const role = getRole()

  useEffect(() => {
    loadData()
  }, [])

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
      const task = await createTask(newTaskTitle, selectedWorkflowId)
      setTasks((prev) => [...prev, task])
      setNewTaskTitle("")
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

  async function handleTriggerTransition(taskId, toStateId) {
    setError("")
    try {
      const updated = await triggerTransition(taskId, toStateId)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      setError(err.response?.data?.detail || "Transition failed")
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
    const wfTransitions = transitions[workflowId] || []
    return wfTransitions.filter(
      (t) => t.from_state_id === currentStateId && t.required_role === role
    )
  }

  return {
    tasks,
    workflows,
    selectedWorkflowId,
    setSelectedWorkflowId,
    newTaskTitle,
    setNewTaskTitle,
    error,
    loading,
    role,
    handleSubmitTask,
    handleTriggerTransition,
    handleLogout,
    getStateName,
    getWorkflowName,
    getAvailableTransitions,
    loadTransitions,
  }
}
