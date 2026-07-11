import type { ThemeMode } from '../../lib/theme'
import { GridScan } from './GridScan'

interface GridScanBackgroundProps {
  theme: ThemeMode
}

export default function GridScanBackground({ theme }: GridScanBackgroundProps) {
  if (theme !== 'cyber') {
    return <div className="fixed inset-0 -z-10 bg-dark-bg" aria-hidden />
  }

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
