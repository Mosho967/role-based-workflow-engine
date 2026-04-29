import { useState } from "react"
import { useAdmin } from "../../hooks/useAdmin"
import { clearAuth } from "../../services/authStorage"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.png"

const TABS = ["Workflow Builder", "Users", "Tasks", "Audit Logs"]
const PRESET_STATES = ["Under Review", "In Progress", "Approved", "Rejected", "Changes Requested", "Completed", "Cancelled"]

export default function AdminPanel() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("Workflow Builder")
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [transitionWarning, setTransitionWarning] = useState(null)
  const [transitionBlock, setTransitionBlock] = useState(null)
  const [warningShakeKey, setWarningShakeKey] = useState(0)
  const [suspiciousTransitions, setSuspiciousTransitions] = useState([])
  const [showBuilderHelp, setShowBuilderHelp] = useState(false)
  const [showUsersHelp, setShowUsersHelp] = useState(false)
  const LIMIT = 5
  const {
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
    handleDeleteTransition,
    handleCreateUser,
    handleDeactivateUser,
    handleTriggerTransition,
    getStateName,
    getStateNameFromMap,
    getStateNameForAuditLog,
    getWorkflowName,
    getAvailableAdminTransitions,
  } = useAdmin()

  function handleLogout() {
    clearAuth()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-green-100">
      {/* Top bar */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center border-b-2 border-green-600">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold text-green-700">Cogflow</h1>
          <span className="text-gray-400 font-light">|</span>
          <span className="text-sm font-medium text-gray-500">Admin</span>
        </div>
        <button onClick={handleLogout} className="text-sm font-bold text-green-900 hover:underline">
          Logout
        </button>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-6">
        <div className="max-w-4xl mx-auto flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Workflow Builder */}
        {activeTab === "Workflow Builder" && (
          <div className="space-y-8">
            <div className="bg-white rounded shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">Workflow Builder</h2>
                <button
                  onClick={() => setShowBuilderHelp(p => !p)}
                  className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold hover:bg-green-100 hover:text-green-700 transition-colors flex items-center justify-center"
                  title="How it works"
                >?</button>
              </div>

              <div
                style={{
                  maxHeight: showBuilderHelp ? "300px" : "0px",
                  opacity: showBuilderHelp ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.35s ease, opacity 0.3s ease",
                }}
              >
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-gray-700 space-y-2">
                  <p><span className="font-semibold text-green-800">States</span> are the stages a task moves through (e.g. Under Review, Approved). Every workflow needs at least one <span className="bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5 text-[10px] font-medium">start</span> state and one <span className="bg-red-100 text-red-500 rounded-full px-1.5 py-0.5 text-[10px] font-medium">end</span> state.</p>
                  <p><span className="font-semibold text-green-800">Transitions</span> define which state a task can move to, and which role is allowed to trigger it.</p>
                  <p><span className="font-semibold text-green-800">Roles:</span> <span className="font-medium">user</span> submits tasks · <span className="font-medium">reviewer</span> approves or rejects · <span className="font-medium">admin</span> manages the workflow</p>
                  <p><span className="bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5 text-[10px] font-medium">stuck</span> <span className="text-gray-600">means a non-final state has no outgoing transitions — tasks that reach it will be unable to move. Add a transition out of it to resolve.</span></p>
                  <p className="text-xs text-gray-400">Tip: assign Approve/Reject transitions to <span className="font-medium">reviewer</span> so the reviewer role has meaningful actions.</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  placeholder="Workflow name"
                  value={newWorkflowName}
                  onChange={e => setNewWorkflowName(e.target.value)}
                />
                <button
                  onClick={handleCreateWorkflow}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 hover:shadow-md transition-all"
                >
                  Create Workflow
                </button>
              </div>

              {workflows.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Select a workflow to configure:</p>
                  <div className="flex flex-wrap gap-2">
                    {workflows.map(wf => (
                      <button
                        key={wf.id}
                        onClick={() => handleSelectWorkflow(wf)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${selectedWorkflow?.id === wf.id ? "bg-green-600 text-white border-green-600 shadow-sm" : "bg-white text-gray-600 hover:bg-green-50 hover:border-green-400"}`}
                      >
                        {wf.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedWorkflow && (
                <div className="border-t pt-4 space-y-6">
                  <p className="text-sm font-semibold text-gray-700">Configuring: {selectedWorkflow.name}</p>

                  <div>
                    <p className="text-sm font-medium mb-2">Add State</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        className="border rounded px-3 py-2 text-sm"
                        value=""
                        onChange={e => {
                          if (!e.target.value) return
                          const name = e.target.value
                          const isFinal = /approved|rejected|completed|cancelled/i.test(name)
                          setNewState(prev => ({ ...prev, name, is_initial: false, is_final: isFinal }))
                        }}
                      >
                        <option value="">Quick select...</option>
                        {PRESET_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        type="text"
                        className="border rounded px-3 py-2 text-sm"
                        placeholder="Or type custom name"
                        value={newState.name}
                        onChange={e => setNewState(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                        {[
                          { label: "None", is_initial: false, is_final: false },
                          { label: "Start", is_initial: true,  is_final: false },
                          { label: "End",   is_initial: false, is_final: true  },
                        ].map(opt => {
                          const active = newState.is_initial === opt.is_initial && newState.is_final === opt.is_final
                          const colour = active
                            ? opt.label === "Start" ? "bg-blue-500 text-white"
                            : opt.label === "End"   ? "bg-red-500 text-white"
                            : "bg-green-600 text-white"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => setNewState(prev => ({ ...prev, is_initial: opt.is_initial, is_final: opt.is_final }))}
                              className={`px-3 py-2 transition-colors ${colour}`}
                            >{opt.label}</button>
                          )
                        })}
                      </div>
                      <button
                        onClick={handleCreateState}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 hover:shadow-md transition-all"
                      >
                        Add State
                      </button>
                    </div>

                    {states.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {states.map(s => {
                          const hasOutgoing = transitions.some(t => t.from_state_id === s.id)
                          const deadEnd = !s.is_final && !hasOutgoing
                          return (
                            <span key={s.id} className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1 ${deadEnd ? "bg-orange-50 border border-orange-300 text-orange-800" : "bg-green-50 border border-green-200 text-green-800"}`}>
                              {s.name}
                              {s.is_initial && <span className="bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5 text-[10px] font-medium">start</span>}
                              {s.is_final && <span className="bg-red-100 text-red-500 rounded-full px-1.5 py-0.5 text-[10px] font-medium">end</span>}
                              {deadEnd && <span title="No outgoing transitions — tasks will get stuck here" className="bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5 text-[10px] font-medium">stuck</span>}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {states.length >= 2 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Add Transition</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <select
                          className="border rounded px-3 py-2 text-sm"
                          value={newTransition.from_state_id}
                          onChange={e => setNewTransition(prev => ({ ...prev, from_state_id: e.target.value }))}
                        >
                          <option value="">From state</option>
                          {states.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-500">→</span>
                        <select
                          className="border rounded px-3 py-2 text-sm"
                          value={newTransition.to_state_id}
                          onChange={e => {
                            const toId = e.target.value
                            const toState = states.find(s => s.id === toId)
                            setNewTransition(prev => ({
                              ...prev,
                              to_state_id: toId,
                              required_role: toState && /approved|rejected|completed|changes requested/i.test(toState.name) ? "reviewer" : prev.required_role
                            }))
                          }}
                        >
                          <option value="">To state</option>
                          {states.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <select
                          className="border rounded px-3 py-2 text-sm"
                          value={newTransition.required_role}
                          onChange={e => setNewTransition(prev => ({ ...prev, required_role: e.target.value }))}
                        >
                          <option value="user">user</option>
                          <option value="reviewer">reviewer</option>
                          <option value="admin">admin</option>
                        </select>
                        <button
                          onClick={() => {
                            const from = states.find(s => s.id === newTransition.from_state_id)
                            const to = states.find(s => s.id === newTransition.to_state_id)
                            const role = newTransition.required_role
                            const isTerminal = to && /approved|rejected|completed/i.test(to.name)
                            let block = null
                            let warning = null
                            const isDuplicate = transitions.some(t =>
                              t.from_state_id === newTransition.from_state_id &&
                              t.to_state_id === newTransition.to_state_id &&
                              t.required_role === newTransition.required_role
                            )
                            if (isDuplicate) {
                              block = "Transition already exists."
                            } else if (newTransition.from_state_id === newTransition.to_state_id) {
                              block = "A transition cannot go from a state back to itself — the task would not move anywhere."
                            } else if (from?.is_final) {
                              block = "This starts from a final (end) state. Tasks in a final state cannot be moved, so this transition will never fire."
                            } else if (from?.is_initial && to?.is_final) {
                              warning = "This goes directly from the start state to an end state, skipping any review steps. Tasks will jump straight to a terminal state."
                            } else if (to?.is_initial) {
                              warning = "This loops back to the initial state. Tasks would restart from the beginning, which is not typical for an approval workflow."
                            } else if (role === "user" && isTerminal) {
                              warning = "This lets a regular user approve or reject their own task. Approvals are usually handled by reviewer or admin."
                            } else if (role === "admin" && isTerminal) {
                              warning = "Approve/Reject decisions are usually assigned to reviewer, not admin. This means reviewer will have no meaningful action in this workflow."
                            }
                            if (block) {
                              setTransitionBlock(block)
                              setTransitionWarning(null)
                              setWarningShakeKey(k => k + 1)
                            } else if (warning) {
                              setTransitionWarning(warning)
                              setTransitionBlock(null)
                              setWarningShakeKey(k => k + 1)
                            } else {
                              handleCreateTransition()
                            }
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 hover:shadow-md transition-all"
                        >
                          Add Transition
                        </button>
                      </div>

                      {transitionBlock && (
                        <div key={warningShakeKey} className="mt-3 bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-800" style={{ animation: "shake 0.5s ease" }}>
                          <p className="font-medium mb-1">Cannot add this transition</p>
                          <p className="mb-3">{transitionBlock}</p>
                          <button
                            onClick={() => setTransitionBlock(null)}
                            className="text-red-700 px-3 py-1 rounded text-xs font-medium hover:underline"
                          >Dismiss</button>
                        </div>
                      )}

                      {transitionWarning && (
                        <div key={warningShakeKey} className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 text-sm text-yellow-800" style={{ animation: "shake 0.5s ease" }}>
                          <p className="font-medium mb-1">Are you sure?</p>
                          <p className="mb-3">{transitionWarning}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSuspiciousTransitions(prev => [...prev, {
                                  from: newTransition.from_state_id,
                                  to: newTransition.to_state_id,
                                  role: newTransition.required_role,
                                }])
                                handleCreateTransition()
                                setTransitionWarning(null)
                              }}
                              className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-yellow-700"
                            >Add anyway</button>
                            <button
                              onClick={() => setTransitionWarning(null)}
                              className="text-yellow-700 px-3 py-1 rounded text-xs font-medium hover:underline"
                            >Cancel</button>
                          </div>
                        </div>
                      )}

                      {transitions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {transitions.map(t => {
                            const isSuspicious = suspiciousTransitions.some(s => s.from === t.from_state_id && s.to === t.to_state_id && s.role === t.required_role)
                            return (
                            <span key={t.id} className={`inline-flex items-center gap-1 text-xs rounded-full px-3 py-1 ${isSuspicious ? "bg-yellow-50 border border-yellow-300 text-yellow-800" : "bg-green-50 border border-green-200 text-green-800"}`}>
                              {isSuspicious && <span title="Added despite a warning">⚠️</span>}
                              {getStateName(t.from_state_id)} → {getStateName(t.to_state_id)} · {t.required_role}
                              <button
                                onClick={() => handleDeleteTransition(t.id)}
                                className="ml-1 bg-green-800 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-500 transition-colors"
                                style={{ fontSize: "13px", lineHeight: 1, paddingBottom: "1px" }}
                                title="Delete transition"
                              >×</button>
                            </span>
                          )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === "Users" && (
          <div className="bg-white rounded shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">User Management</h2>
              <button
                onClick={() => setShowUsersHelp(p => !p)}
                className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold hover:bg-green-100 hover:text-green-700 transition-colors flex items-center justify-center"
                title="How it works"
              >?</button>
            </div>

            <div
              style={{
                maxHeight: showUsersHelp ? "200px" : "0px",
                opacity: showUsersHelp ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.35s ease, opacity 0.3s ease",
              }}
            >
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-gray-700 space-y-2">
                <p><span className="font-semibold text-green-800">Users</span> are created by the admin and assigned a role on signup — they cannot self-register as reviewer or admin.</p>
                <p><span className="font-semibold text-green-800">Roles:</span> <span className="font-medium">user</span> submits tasks · <span className="font-medium">reviewer</span> approves or rejects · <span className="font-medium">admin</span> manages everything</p>
                <p className="text-xs text-gray-400">Tip: deactivating a user prevents them from logging in without deleting their history.</p>
              </div>
            </div>

            <p className="text-sm font-medium mb-2">Create New User</p>
            <div className="flex flex-wrap gap-2 mb-6 items-end">
              <input
                type="text"
                autoComplete="off"
                className="border rounded px-3 py-2 text-sm"
                placeholder="Username"
                value={newUser.username}
                onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
              />
              <input
                type="text"
                autoComplete="off"
                className="border rounded px-3 py-2 text-sm"
                placeholder="Email"
                value={newUser.email}
                onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
              <input
                type="password"
                autoComplete="new-password"
                className="border rounded px-3 py-2 text-sm"
                placeholder="Password"
                value={newUser.password}
                onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
              <select
                className="border rounded px-3 py-2 text-sm"
                value={newUser.role}
                onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="user">user</option>
                <option value="reviewer">reviewer</option>
                <option value="admin">admin</option>
              </select>
              <button
                onClick={handleCreateUser}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 hover:shadow-md transition-all"
              >
                Create
              </button>
            </div>

            {users.length > 0 && (
              <>
                <p className="text-sm font-medium mb-2">Existing Users</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Username</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Active</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2">{u.username}</td>
                        <td className="py-2">{u.email}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === "admin" ? "bg-red-100 text-red-700" : u.role === "reviewer" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2">{u.is_active ? "Yes" : "No"}</td>
                        <td className="py-2">
                          {u.is_active && u.role !== "admin" && (
                            <button
                              onClick={() => setConfirmDeactivate(u)}
                              className="text-xs font-bold text-green-700 hover:underline"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Tasks */}
        {activeTab === "Tasks" && (
          <div className="bg-white rounded shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">All Tasks</h2>
              {tasks.length > LIMIT && (
                <button onClick={() => setShowAllTasks(prev => !prev)} className="text-sm text-green-600 hover:underline">
                  {showAllTasks ? "Show less" : `View all ${tasks.length}`}
                </button>
              )}
            </div>
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks in the system.</p>
            ) : (
              <div className="space-y-3">
                {(showAllTasks ? tasks : tasks.slice(0, LIMIT)).map(task => {
                  const available = getAvailableAdminTransitions(task.workflow_id, task.current_state_id)
                  const adminTransitions = available.filter(t => t.required_role === "admin")
                  const waitingFor = [...new Set(available.filter(t => t.required_role !== "admin").map(t => t.required_role))]
                  const stateName = getStateNameFromMap(task.workflow_id, task.current_state_id)
                  const stateKey = stateName.toLowerCase()
                  const stateBadge = /approved|completed|done/.test(stateKey)
                    ? "bg-green-100 text-green-700"
                    : /rejected|cancelled|denied/.test(stateKey)
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                  return (
                    <div key={task.id} className="border rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{task.title}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stateBadge}`}>
                          {stateName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Workflow: {getWorkflowName(task.workflow_id)}</p>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {adminTransitions.map(t => (
                          <button
                            key={t.id}
                            onClick={() => handleTriggerTransition(task.id, t.to_state_id)}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Move to {getStateNameFromMap(task.workflow_id, t.to_state_id)}
                          </button>
                        ))}
                        {waitingFor.map(role => (
                          <span key={role} className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            Waiting for {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Audit Logs */}
        {activeTab === "Audit Logs" && (
          <div className="bg-white rounded shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Audit Logs</h2>
              {auditLogs.length > LIMIT && (
                <button onClick={() => setShowAllLogs(prev => !prev)} className="text-sm text-green-600 hover:underline">
                  {showAllLogs ? "Show less" : `View all ${auditLogs.length}`}
                </button>
              )}
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">No audit logs yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Task</th>
                    <th className="pb-2">From</th>
                    <th className="pb-2">To</th>
                    <th className="pb-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllLogs ? auditLogs : auditLogs.slice(0, LIMIT)).map(log => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2">{tasks.find(t => t.id === log.task_id)?.title || log.task_id.slice(0, 8) + "…"}</td>
                      <td className="py-2">{getStateNameForAuditLog(log.task_id, log.from_state_id)}</td>
                      <td className="py-2">{getStateNameForAuditLog(log.task_id, log.to_state_id)}</td>
                      <td className="py-2 text-xs text-gray-400">{new Date(log.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Warning</h3>
            <p className="text-sm text-gray-600 mb-1">
              You are about to deactivate <span className="font-medium">{confirmDeactivate.username}</span>.
            </p>
            <p className="text-sm text-red-600 mb-6">This will block them from logging in. Are you sure?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleDeactivateUser(confirmDeactivate.id); setConfirmDeactivate(null) }}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
