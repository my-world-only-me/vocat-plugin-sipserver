import React from 'react'
import { createRoot } from 'react-dom/client'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import CallLog from './pages/CallLog'
import Settings from './pages/Settings'
import './styles.css'

// Each contribution points at its own HTML entry (index/accounts/call-log/
// settings), and VoCat loads it in an iframe from
// /plugin-assets/vocat-sipserver/<entry>.html.
//
// A BrowserRouter cannot work here: the iframe pathname is the asset path,
// which never matches a route like "/accounts", so the route table would fall
// through and render nothing. Picking the component from the entry filename
// removes the mismatch entirely.
const PAGE_BY_ENTRY: Record<string, React.ComponentType> = {
  'index.html': Dashboard,
  'accounts.html': Accounts,
  'call-log.html': CallLog,
  'settings.html': Settings,
}

function currentEntry(): string {
  const name = window.location.pathname.split('/').pop() || 'index.html'
  return name === '' ? 'index.html' : name
}

function App() {
  const Page = PAGE_BY_ENTRY[currentEntry()] ?? Dashboard
  return <Page />
}

createRoot(document.getElementById('root')!).render(<App />)
