/* Shared CTA buttons — identical markup and links in all three original locations. */

export function GetInTouchButton() {
  return (
    <a href="#contact" className="btn btn-pill-red">
      GET IN TOUCH <i className="fa-solid fa-circle-phone" />
    </a>
  )
}

export function ScheduleMeetingButton({ light = false }) {
  return (
    <a
      href="https://calendly.com/team-stillloud/30min?month=2026-08"
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-schedule${light ? ' btn-schedule--light' : ''}`}
    >
      <i className="fas fa-calendar-alt" /> Schedule a Meeting
    </a>
  )
}
