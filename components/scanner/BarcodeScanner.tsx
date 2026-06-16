"use client"

import { useEffect, useRef, useState } from "react"
import { IconX } from "@tabler/icons-react"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { NotFoundException } from "@zxing/library"

interface BarcodeScannerProps {
  onScan: (value: string, format: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [scanning, setScanning] = useState(true)
  const [lineY, setLineY] = useState(0)
  const animRef = useRef<number | null>(null)
  const dirRef = useRef(1)

  // Animate scanning line
  useEffect(() => {
    let pos = 0
    function tick() {
      pos += dirRef.current * 1.5
      if (pos >= 100) { pos = 100; dirRef.current = -1 }
      if (pos <= 0) { pos = 0; dirRef.current = 1 }
      setLineY(pos)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    if (!videoRef.current) return

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
      if (result) {
        setScanning(false)
        onScan(result.getText(), result.getBarcodeFormat().toString())
        try { BrowserMultiFormatReader.releaseAllStreams() } catch {}
      } else if (err && !(err instanceof NotFoundException)) {
        // ignore NotFoundException — it fires continuously while no code is in frame
      }
    }).catch(() => {})

    return () => {
      try { BrowserMultiFormatReader.releaseAllStreams() } catch {}
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Close button */}
      <button
        onClick={() => {
          try { BrowserMultiFormatReader.releaseAllStreams() } catch {}
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

      {/* Viewfinder overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Dark surround */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Clear window */}
        <div className="relative w-64 h-64 z-10">
          {/* Corner brackets */}
          {[
            "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
            "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
            "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-8 h-8 border-white ${cls}`} />
          ))}

          {/* Scanning line */}
          <div
            className="absolute left-2 right-2 h-0.5 bg-emerald-400 opacity-90"
            style={{ top: `${lineY}%`, boxShadow: "0 0 6px 1px rgba(52,211,153,0.7)" }}
          />
        </div>

        {/* Label */}
        <p className="relative z-10 mt-6 text-sm text-white/70">
          {scanning ? "Point camera at barcode or QR code" : "Scanned!"}
        </p>
      </div>
    </div>
  )
}
