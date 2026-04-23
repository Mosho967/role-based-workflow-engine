import { useEffect, useState } from "react"
import { fetchAllAuditLogs, fetchUsers, createUser as apiCreateUser, deactivateUser as apiDeactivateUser } from "../api/admin"
import { fetchWorkflows, createWorkflow as apiCreateWorkflow, fetchStates, fetchTransitions, createState as apiCreateState, createTransition as apiCreateTransition, triggerTransition } from "../api/workflows"
import { fetchTasks } from "../api/tasks"

export function useAdmin() {
  const [workflows, setWorkflows] = useState([])
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [states, setStates] = useState([])
  const [transitions, setTransitions] = useState([])
  const [statesMap, setStatesMap] = useState({})
  const [transitionsMap, setTransitionsMap] = useState({})
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [error, setError] = useState("")

  const [newWorkflowName, setNewWorkflowName] = useState("")
  const [newState, setNewState] = useState({ name: "", is_initial: false, is_final: false })
  const [newTransition, setNewTransition] = useState({ from_state_id: "", to_state_id: "", required_role: "user" })
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "user" })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [wf, t, u, a] = await Promise.all([
        fetchWorkflows(),
        fetchTasks(),
        fetchUsers(),
        fetchAllAuditLogs(),
      ])
      setWorkflows(wf)
      setTasks(t)
      setUsers(u)
      setAuditLogs(a)

      const uniqueWorkflowIds = [...new Set(t.map(task => task.workflow_id))]
      const entries = await Promise.all(
        uniqueWorkflowIds.map(async (wfId) => {
          const [s, tr] = await Promise.all([fetchStates(wfId), fetchTransitions(wfId)])
          return { wfId, s, tr }
        })
      )
      const sm = {}
      const tm = {}
      entries.forEach(({ wfId, s, tr }) => {
        sm[wfId] = s
        tm[wfId] = tr
      })
      setStatesMap(sm)
      setTransitionsMap(tm)
    } catch {
      setError("Failed to load data")
    }
  }

  async function handleSelectWorkflow(workflow) {
    setSelectedWorkflow(workflow)
    setNewState({ name: "", is_initial: false, is_final: false })
    setNewTransition({ from_state_id: "", to_state_id: "", required_role: "user" })
    try {
      const [s, t] = await Promise.all([
        fetchStates(workflow.id),
        fetchTransitions(workflow.id),
      ])
      setStates(s)
      setTransitions(t)
    } catch {
      setError("Failed to load workflow details")
    }
  }

  async function handleCreateWorkflow() {
    if (!newWorkflowName.trim()) return
    try {
      const wf = await apiCreateWorkflow(newWorkflowName.trim())
      setWorkflows(prev => [...prev, wf])
      setNewWorkflowName("")
    } catch {
      setError("Failed to create workflow")
    }
  }

  async function handleCreateState() {
    if (!selectedWorkflow || !newState.name.trim()) return
    try {
      const s = await apiCreateState(selectedWorkflow.id, newState.name.trim(), newState.is_initial, newState.is_final)
      setStates(prev => [...prev, s])
      setNewState({ name: "", is_initial: false, is_final: false })
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create state")
    }
  }

  async function handleCreateTransition() {
    if (!selectedWorkflow || !newTransition.from_state_id || !newTransition.to_state_id) return
    try {
      const t = await apiCreateTransition(
        selectedWorkflow.id,
        newTransition.from_state_id,
        newTransition.to_state_id,
        newTransition.required_role
      )
      setTransitions(prev => [...prev, t])
      setNewTransition({ from_state_id: "", to_state_id: "", required_role: "user" })
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create transition")
    }
  }

  async function handleCreateUser() {
    if (!newUser.username || !newUser.email || !newUser.password) return
    try {
      const u = await apiCreateUser(newUser.username, newUser.email, newUser.password, newUser.role)
      setUsers(prev => [...prev, u])
      setNewUser({ username: "", email: "", password: "", role: "user" })
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map(e => e.msg.replace(/^Value error, /i, "")).join(", "))
      } else {
        setError(detail || "Failed to create user")
      }
    }
  }

  async function handleDeactivateUser(userId) {
    try {
      const updated = await apiDeactivateUser(userId)
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to deactivate user")
    }
  }

  async function handleTriggerTransition(taskId, toStateId) {
    try {
      const updated = await triggerTransition(taskId, toStateId)
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    } catch (err) {
      setError(err.response?.data?.detail || "Transition failed")
    }
  }

  function getStateName(stateId) {
    return states.find(s => s.id === stateId)?.name || stateId
  }

  function getStateNameFromMap(workflowId, stateId) {
    return statesMap[workflowId]?.find(s => s.id === stateId)?.name || stateId
  }

  function getWorkflowName(workflowId) {
    return workflows.find(w => w.id === workflowId)?.name || workflowId
  }

  function getStateNameForAuditLog(taskId, stateId) {
    if (!stateId) return "—"
    const task = tasks.find(t => t.id === taskId)
    if (!task) return stateId.slice(0, 8) + "…"
    return statesMap[task.workflow_id]?.find(s => s.id === stateId)?.name || stateId.slice(0, 8) + "…"
  }

  function getAvailableAdminTransitions(workflowId, currentStateId) {
    return (transitionsMap[workflowId] || []).filter(
      t => t.from_state_id === currentStateId && t.required_role === "admin"
    )
  }

  return {
    workflows, selectedWorkflow, states, transitions,
    tasks, users, auditLogs, error,
    newWorkflowName, setNewWorkflowName,
    newState, setNewState,
    newTransition, setNewTransition,
    newUser, setNewUser,
    handleSelectWorkflow,
    handleCreateWorkflow,
    handleCreateState,
    handleCreateTransition,
    handleCreateUser,
    handleDeactivateUser,
    handleTriggerTransition,
    getStateName,
    getStateNameFromMap,
    getStateNameForAuditLog,
    getWorkflowName,
    getAvailableAdminTransitions,
  }
}
