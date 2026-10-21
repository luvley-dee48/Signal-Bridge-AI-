/** Large looping type band — adapted from the reference's repeating headline band. */
export function BigMarquee() {
  const words = ['SEE THE SIGNAL', 'READ THE EVIDENCE', 'KNOW THE NEXT STEP']
  return (
    <div className="big-marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((n) =>
          words.map((w, i) => (
            <span key={`${n}-${i}`} className={i === 1 ? 'fill' : ''}>
              {w}
            </span>
          )),
        )}
      </div>
    </div>
  )
}
