import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/dashboard/Dashboard"
import AdminPanel from "./pages/admin/AdminPanel"

function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const role = localStorage.getItem("role")
  if (!localStorage.getItem("token")) return <Navigate to="/login" />
  if (role !== "admin") return <Navigate to="/dashboard" />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={<PrivateRoute><Dashboard /></PrivateRoute>}
        />
        <Route
          path="/admin"
          element={<AdminRoute><AdminPanel /></AdminRoute>}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}
