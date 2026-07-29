import stonespiritBg from '../../assets/images/themes/stonespirit-bg.png'

export default function StoneSpiritBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#2E1A47]" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${stonespiritBg})` }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 95% 85% at 50% 45%, rgba(46, 26, 71, 0.05) 0%, rgba(46, 26, 71, 0.38) 65%, rgba(22, 12, 38, 0.72) 100%)',
        }}
      />

      <div className="stonespirit-sparkle-field absolute inset-0 pointer-events-none" />
    </div>
  )
}
