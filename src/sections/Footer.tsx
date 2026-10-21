import { Brand } from '../components/Logo'
import { REPO_URL, CONTACT_URL } from '../lib/config'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="foot-grid">
          <div>
            <Brand />
            <p>Location-specific environmental intelligence grounded in evidence, transparency, and practical action.</p>
          </div>
          <div>
            <h4>Platform</h4>
            <ul>
              <li><a href="#explorer">Global Overview</a></li>
              <li><a href="#briefing">Location Intelligence</a></li>
              <li><a href="#monitoring">Live Monitoring (planned)</a></li>
              <li><a href="#capabilities">All capabilities</a></li>
            </ul>
          </div>
          <div>
            <h4>Resources</h4>
            <ul>
              <li><a href="#methodology">Data &amp; Methodology</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href={REPO_URL} target="_blank" rel="noreferrer">Source code</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#partners">Partnerships &amp; pilots</a></li>
              <li><a href={CONTACT_URL} target="_blank" rel="noreferrer">Contact</a></li>
              <li><a href="#pricing">Access &amp; pricing</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <p>
            © {new Date().getFullYear()} SignalBridge — prototype. SignalBridge assessments are not
            official warnings; follow your national authorities in an emergency. This site has no
            backend or accounts; your browser requests data directly from USGS, NASA EONET,
            Open-Meteo and CARTO/OpenStreetMap, which therefore see your IP address. Event data:{' '}
            <a className="text-link" href="https://earthquake.usgs.gov/" target="_blank" rel="noreferrer">USGS</a>,{' '}
            <a className="text-link" href="https://eonet.gsfc.nasa.gov/" target="_blank" rel="noreferrer">NASA EONET</a>.{' '}
            <a className="text-link" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Geocoding by Open-Meteo.com</a>.
            Basemap © OpenStreetMap contributors © CARTO. Land outlines: Natural Earth.
          </p>
        </div>
      </div>
    </footer>
  )
}
