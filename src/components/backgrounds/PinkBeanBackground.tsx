import pinkbeanBg from '../../assets/images/themes/pinkbean-bg.png'

export default function PinkBeanBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${pinkbeanBg})` }}
      />

      <div className="pinkbean-sparkle-field absolute inset-0 pointer-events-none" />
    </div>
  )
}
