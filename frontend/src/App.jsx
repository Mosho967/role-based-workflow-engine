import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Splash from "./pages/Splash"
import About from "./pages/About"
import Welcome from "./pages/Welcome"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/dashboard/Dashboard"
import AdminPanel from "./pages/admin/AdminPanel"
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard"
import TaskDetail from "./pages/task/TaskDetail"

function PrivateRoute({ children }) {
  return sessionStorage.getItem("token") ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const role = sessionStorage.getItem("role")
  if (!sessionStorage.getItem("token")) return <Navigate to="/login" />
  if (role !== "admin") return <Navigate to="/dashboard" />
  return children
}

function ReviewerRoute({ children }) {
  const role = sessionStorage.getItem("role")
  if (!sessionStorage.getItem("token")) return <Navigate to="/login" />
  if (role !== "reviewer") return <Navigate to="/dashboard" />
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
          path="/tasks/:taskId"
          element={<PrivateRoute><TaskDetail /></PrivateRoute>}
        />
        <Route
          path="/reviewer"
          element={<ReviewerRoute><ReviewerDashboard /></ReviewerRoute>}
        />
        <Route
          path="/admin"
          element={<AdminRoute><AdminPanel /></AdminRoute>}
        />
        <Route path="/" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/about" element={<About />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
