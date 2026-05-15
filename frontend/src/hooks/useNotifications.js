import { useEffect, useRef, useState } from "react"
import { getToken } from "../services/authStorage"

const MAX = 30

function readKey(userId) { return `notif_read_${userId}` }

function getReadSet(userId) {
  try { return new Set(JSON.parse(localStorage.getItem(readKey(userId)) || "[]")) }
  catch { return new Set() }
}

function saveReadSet(userId, set) {
  localStorage.setItem(readKey(userId), JSON.stringify([...set].slice(-100)))
}

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    const token = getToken()
    if (!token) return

    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const readSet = getReadSet(userId)
      const id = data.ts ?? Date.now()
      const isRead = readSet.has(id)
      setNotifications(prev => {
        const updated = [{ ...data, id, read: isRead }, ...prev]
        return updated.slice(0, MAX)
      })
      if (!isRead) setUnread(prev => prev + 1)
    }

    ws.onerror = () => {}
    ws.onclose = () => {}

    return () => { ws.close() }
  }, [userId])

  function markTaskRead(taskId) {
    if (!taskId) return
    const readSet = getReadSet(userId)
    let delta = 0
    setNotifications(prev => prev.map(n => {
      if (n.task_id === taskId && !n.read) {
        readSet.add(n.id)
        delta++
        return { ...n, read: true }
      }
      return n
    }))
    saveReadSet(userId, readSet)
    setUnread(prev => Math.max(0, prev - delta))
  }

  function clearAll() {
    setNotifications([])
    setUnread(0)
  }

  return { notifications, unread, markTaskRead, clearAll }
}
