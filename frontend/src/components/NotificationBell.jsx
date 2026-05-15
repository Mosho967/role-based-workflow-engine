import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function NotificationBell({ notifications, unread, onMarkTaskRead, onClearAll }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleNotificationClick(n) {
    setOpen(false)
    if (n.task_id) {
      onMarkTaskRead(n.task_id)
      navigate(`/tasks/${n.task_id}`)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-full hover:bg-green-50 transition-colors"
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={onClearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
            ) : (
              notifications.map(n => {
                const actor = n.actioned_by || n.submitted_by
                const message = n.message || ""
                const parts = actor ? message.split(actor) : [message]
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 cursor-pointer hover:bg-green-100 transition-colors ${n.read ? "bg-white" : "bg-green-50"}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                      <div className={!n.read ? "" : "pl-3.5"}>
                        <p className="text-sm font-semibold text-gray-800">
                          {parts.map((part, i) => (
                            <span key={i}>
                              {part}
                              {i < parts.length - 1 && <span className="text-green-600">{actor}</span>}
                            </span>
                          ))}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(n.id).toLocaleTimeString(undefined, { timeStyle: "short" })}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
