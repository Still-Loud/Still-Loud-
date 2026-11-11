'use client'

/* Hero illustration click animation — mirrors js/main.js §8 (Hero Image Click Animation) */
export default function HeroGraphic() {
  const handleClick = (e) => {
    const img = e.currentTarget
    img.classList.remove('animate-click')
    void img.offsetWidth
    img.classList.add('animate-click')
  }

  return (
    <img
      src="/assets/FrontPage%20design.svg"
      alt="Hero Illustration"
      className="hero-illustration-img"
      onClick={handleClick}
    />
  )
}
