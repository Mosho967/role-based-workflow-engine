import { useAdmin } from "../../hooks/useAdmin"
import { clearAuth } from "../../services/authStorage"
import { useNavigate } from "react-router-dom"

export default function AdminPanel() {
  const navigate = useNavigate()
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
    handleCreateUser,
    handleTriggerTransition,
    getStateName,
    getStateNameFromMap,
    getWorkflowName,
    getAvailableAdminTransitions,
  } = useAdmin()

  function handleLogout() {
    clearAuth()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Workflow Builder */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Workflow Builder</h2>

          {/* Create workflow */}
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
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Create Workflow
            </button>
          </div>

          {/* Workflow list */}
          {workflows.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Select a workflow to configure:</p>
              <div className="flex flex-wrap gap-2">
                {workflows.map(wf => (
                  <button
                    key={wf.id}
                    onClick={() => handleSelectWorkflow(wf)}
                    className={`px-3 py-1 rounded text-sm border ${selectedWorkflow?.id === wf.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                  >
                    {wf.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* States and transitions for selected workflow */}
          {selectedWorkflow && (
            <div className="border-t pt-4 space-y-6">
              <p className="text-sm font-semibold text-gray-700">Configuring: {selectedWorkflow.name}</p>

              {/* Add state */}
              <div>
                <p className="text-sm font-medium mb-2">Add State</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="text"
                    className="border rounded px-3 py-2 text-sm"
                    placeholder="State name"
                    value={newState.name}
                    onChange={e => setNewState(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={newState.is_initial}
                      onChange={e => setNewState(prev => ({ ...prev, is_initial: e.target.checked }))}
                    />
                    Initial
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={newState.is_final}
                      onChange={e => setNewState(prev => ({ ...prev, is_final: e.target.checked }))}
                    />
                    Final
                  </label>
                  <button
                    onClick={handleCreateState}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Add State
                  </button>
                </div>

                {states.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {states.map(s => (
                      <span key={s.id} className="text-xs bg-gray-100 border rounded px-2 py-1">
                        {s.name}
                        {s.is_initial && " (initial)"}
                        {s.is_final && " (final)"}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add transition */}
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
                      onChange={e => setNewTransition(prev => ({ ...prev, to_state_id: e.target.value }))}
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
                      onClick={handleCreateTransition}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Add Transition
                    </button>
                  </div>

                  {transitions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {transitions.map(t => (
                        <p key={t.id} className="text-xs text-gray-600">
                          {getStateName(t.from_state_id)} → {getStateName(t.to_state_id)} (role: {t.required_role})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Management */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">User Management</h2>

          <p className="text-sm font-medium mb-2">Create New User</p>
          <div className="flex flex-wrap gap-2 mb-4 items-end">
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
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Create {newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)}
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
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">{u.username}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === "admin" ? "bg-red-100 text-red-700" : u.role === "reviewer" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2">{u.is_active ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </div>

        {/* All Tasks */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">All Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks in the system.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const available = getAvailableAdminTransitions(task.workflow_id, task.current_state_id)
                return (
                  <div key={task.id} className="border rounded p-4">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500">Workflow: {getWorkflowName(task.workflow_id)}</p>
                    <p className="text-sm text-gray-500">
                      State: {getStateNameFromMap(task.workflow_id, task.current_state_id)}
                    </p>
                    {available.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {available.map(t => (
                          <button
                            key={t.id}
                            onClick={() => handleTriggerTransition(task.id, t.to_state_id)}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Move to {getStateNameFromMap(task.workflow_id, t.to_state_id)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Audit Logs</h2>
          {auditLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No audit logs yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Task ID</th>
                  <th className="pb-2">From</th>
                  <th className="pb-2">To</th>
                  <th className="pb-2">When</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2 text-xs text-gray-400">{log.task_id.slice(0, 8)}…</td>
                    <td className="py-2">{log.from_state_id ? log.from_state_id.slice(0, 8) + "…" : "—"}</td>
                    <td className="py-2">{log.to_state_id.slice(0, 8)}…</td>
                    <td className="py-2 text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
