import { GridScan } from './GridScan'

export default function GridScanBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-dark-bg" aria-hidden>
      <GridScan
        enableWebcam={false}
        linesColor="#111827"
        scanColor="#22d3ee"
        scanOpacity={0.32}
        gridScale={0.1}
        lineJitter={0.08}
        noiseIntensity={0.015}
        bloomIntensity={0.08}
        chromaticAberration={0.001}
        className="h-full w-full"
      />
    </div>
  )
}
