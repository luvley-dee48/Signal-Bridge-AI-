import { forwardRef, useState } from 'react'
import { CONTACT_URL, type AccessTab } from '../lib/config'
import { LogoMark } from './Logo'
import { IconClose } from './icons'

interface Props {
  tab: AccessTab
  setTab: (t: AccessTab) => void
}

/**
 * Honest access dialog. SignalBridge has no authentication backend yet, so the
 * form is intentionally disabled — it never pretends to sign anyone in.
 */
export const AccessDialog = forwardRef<HTMLDialogElement, Props>(function AccessDialog(
  { tab, setTab },
  ref,
) {
  const [show, setShow] = useState(false)
  const close = () => (ref as React.RefObject<HTMLDialogElement>).current?.close()
  const signin = tab === 'signin'
  return (
    <dialog
      ref={ref}
      className="access"
      aria-labelledby="access-title"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="access-in">
        <button className="close" aria-label="Close" onClick={close}>
          <IconClose width={16} height={16} />
        </button>
        <LogoMark className="" />
        <div className="tabs" role="tablist" aria-label="Access">
          {(['signin', 'signup'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              className="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
            >
              {t === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>
        <h2 id="access-title">{signin ? 'Accounts are not live yet' : 'Registration is not open yet'}</h2>
        <p className="lead" style={{ marginTop: 0, fontSize: 15 }}>
          SignalBridge is a frontend prototype. There is no authentication service connected, so
          sign-in is disabled rather than simulated. The public explorer needs no account.
        </p>
        <div className="field-row">
          <label htmlFor="acc-email">Email</label>
          <input id="acc-email" type="email" disabled placeholder="Not available yet" />
        </div>
        <div className="field-row">
          <label htmlFor="acc-pass">Password</label>
          <input id="acc-pass" type={show ? 'text' : 'password'} disabled placeholder="Not available yet" />
          <button
            type="button"
            className="text-link"
            style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 12, marginTop: 6, padding: 0 }}
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
          >
            {show ? 'Hide' : 'Show'} password field
          </button>
        </div>
        <button className="btn" style={{ width: '100%', marginTop: 20 }} disabled aria-disabled="true">
          {signin ? 'Sign in' : 'Create account'} — unavailable
        </button>
        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          <a className="btn btn-primary" href="#explorer" onClick={close}>
            Use the public explorer
          </a>
          <a className="btn" href={CONTACT_URL} target="_blank" rel="noreferrer">
            Tell us you’re interested
          </a>
        </div>
      </div>
    </dialog>
  )
})
