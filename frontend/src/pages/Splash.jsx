import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import splashVideo from "../assets/splash_video.mp4"

export default function Splash() {
  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.destination || "/dashboard"
  const videoRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade in
    const fadeIn = setTimeout(() => setVisible(true), 50)

    const video = videoRef.current
    if (!video) return

    const onEnded = () => {
      setVisible(false)
      setTimeout(() => navigate(destination), 600)
    }
    video.addEventListener("ended", onEnded)

    const fallback = setTimeout(() => {
      setVisible(false)
      setTimeout(() => navigate(destination), 600)
    }, 10000)

    return () => {
      clearTimeout(fadeIn)
      clearTimeout(fallback)
      video.removeEventListener("ended", onEnded)
    }
  }, [navigate, destination])

  return (
    <div
      className="min-h-screen bg-[#007349] flex items-center justify-center transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="pointer-events-none w-full h-full">
        <video
          ref={videoRef}
          src={splashVideo}
          autoPlay
          muted
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
