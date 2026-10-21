import { useCallback, useRef, useState } from 'react'
import { AccessDialog } from './components/AccessDialog'
import { Background } from './components/Background'
import { Nav } from './components/Nav'
import type { AccessTab } from './lib/config'
import { placeLabel, type Place } from './lib/geocode'
import { useHazards } from './lib/hazards'
import { useReducedMotion } from './lib/motion'
import type { FocusTarget, HazardEvent } from './lib/types'
import { BigMarquee } from './sections/BigMarquee'
import { Briefing } from './sections/Briefing'
import { Capabilities } from './sections/Capabilities'
import { Explorer } from './sections/Explorer'
import { Faq } from './sections/Faq'
import { FinalCta } from './sections/FinalCta'
import { Footer } from './sections/Footer'
import { Hero } from './sections/Hero'
import { Methodology } from './sections/Methodology'
import { Monitoring } from './sections/Monitoring'
import { Partners } from './sections/Partners'
import { Pipeline } from './sections/Pipeline'
import { Pricing } from './sections/Pricing'
import { Trust } from './sections/Trust'
import { UseCases } from './sections/UseCases'
import { Why } from './sections/Why'
import { CONTACT_URL } from './lib/config'

export default function App() {
  const hz = useHazards()
  const reduced = useReducedMotion()
  const [focus, setFocus] = useState<FocusTarget | null>(null)
  const nonce = useRef(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<AccessTab>('signin')

  const toExplorer = useCallback(() => {
    document
      .getElementById('explorer-map')
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }, [reduced])

  const onPlace = useCallback(
    (p: Place) => {
      setFocus({ lon: p.lon, lat: p.lat, label: placeLabel(p), kind: 'place', nonce: ++nonce.current })
      toExplorer()
    },
    [toExplorer],
  )

  const onEvent = useCallback(
    (e: HazardEvent) => {
      setFocus({ lon: e.lon, lat: e.lat, label: e.title, kind: 'event', eventId: e.id, nonce: ++nonce.current })
      toExplorer()
    },
    [toExplorer],
  )

  const openAccess = useCallback((t: AccessTab) => {
    setTab(t)
    dialog.current?.showModal()
  }, [])

  return (
    <>
      <a className="skip-link" href="#explorer">Skip to the explorer</a>
      <Background />
      <Nav openAccess={openAccess} />
      <main>
        <Hero hz={hz} onPlace={onPlace} onEvent={onEvent} />
        <Explorer hz={hz} focus={focus} onPlace={onPlace} onEvent={onEvent} onClear={() => setFocus(null)} />
        <Trust hz={hz} />
        <Why />
        <BigMarquee />
        <Pipeline />
        <Capabilities hz={hz} />
        <UseCases />
        <Monitoring onInterest={CONTACT_URL} />
        <Briefing hz={hz} focus={focus} />
        <Methodology hz={hz} />
        <Pricing openAccess={openAccess} />
        <Partners />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <AccessDialog ref={dialog} tab={tab} setTab={setTab} />
    </>
  )
}
