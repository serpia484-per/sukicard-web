"use client"

import { useEffect, useRef } from "react"
import { IconX } from "@tabler/icons-react"

interface PhotoCaptureProps {
  onCapture: (photoDataUrl: string) => void
  onClose: () => void
}

export default function PhotoCapture({ onCapture, onClose }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      })
      .catch(() => onClose())

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [onClose])

  function handleCapture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onCapture(dataUrl)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Close button */}
      <button
        onClick={() => {
          streamRef.current?.getTracks().forEach((t) => t.stop())
          onClose()
        }}
        className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white"
      >
        <IconX size={20} stroke={2} />
      </button>

      {/* Camera feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Capture button */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none">
        <button
          onClick={handleCapture}
          className="pointer-events-auto w-16 h-16 rounded-full bg-white shadow-lg border-4 border-white/60 active:scale-95 transition-transform"
        />
      </div>
    </div>
  )
}
