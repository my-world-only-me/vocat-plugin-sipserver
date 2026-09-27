import { useEffect, useRef, useState, useCallback } from 'react'
import { api, PROXY_PREFIX, SIPAccount, Call } from './api'

type WSMessage = {
  type: 'state' | 'event' | 'heartbeat'
  event?: string
  data?: any
  accounts?: SIPAccount[]
  calls?: Call[]
  config?: any
  time?: string
}

export function useWebSocket(onEvent?: (event: string, data: any) => void) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  // Keep the latest handler in a ref instead of a dependency. Call sites pass
  // an inline arrow function, so its identity changes on every render; wiring
  // it straight into `connect`'s deps recreated the socket on each render and
  // produced a connect/close storm that also spammed the server with canceled
  // session lookups.
  const onEventRef = useRef(onEvent)
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const connect = useCallback(() => {
    // Guard against overlapping sockets if a reconnect timer fires while a
    // previous attempt is still settling.
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.CONNECTING ||
        wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // /ws sits outside the backend's /api prefix, so only the proxy prefix
    // is prepended here.
    const ws = new WebSocket(`${protocol}//${window.location.host}${PROXY_PREFIX}/ws`)

    ws.onopen = () => {
      setConnected(true)
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        const handler = onEventRef.current
        if (msg.type === 'event' && msg.event && handler) {
          handler(msg.event, msg.data)
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
      console.log('WebSocket disconnected, reconnecting...')
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      const ws = wsRef.current
      wsRef.current = null
      // Drop handlers first so the teardown close cannot schedule a reconnect.
      if (ws) {
        ws.onclose = null
        ws.onerror = null
        ws.onopen = null
        ws.onmessage = null
        ws.close()
      }
    }
  }, [connect])

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { connected, send }
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<SIPAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      setError(null)
      const data = await api.getAccounts()
      setAccounts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const create = async (data: Partial<SIPAccount>) => {
    const acc = await api.createAccount(data)
    setAccounts(prev => [...prev, acc])
    return acc
  }

  const update = async (id: string, data: Partial<SIPAccount>) => {
    const acc = await api.updateAccount(id, data)
    setAccounts(prev => prev.map(a => a.id === id ? acc : a))
    return acc
  }

  const remove = async (id: string) => {
    await api.deleteAccount(id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  return { accounts, loading, error, refetch: fetchAccounts, create, update, remove }
}

export function useCalls() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalls = useCallback(async () => {
    try {
      setError(null)
      const data = await api.getCalls()
      setCalls(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calls')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  return { calls, loading, error, refetch: fetchCalls }
}

export function useSettings() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.getSettings()
      setSettings(data)
    } catch (e) {
      console.error('Failed to load settings:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const update = async (data: any) => {
    const updated = await api.updateSettings(data)
    setSettings(updated)
    return updated
  }

  return { settings, loading, update }
}

export function useDevices() {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDevices = useCallback(async () => {
    try {
      const data = await api.getDevices()
      setDevices(data)
    } catch (e) {
      console.error('Failed to load devices:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  return { devices, loading, refetch: fetchDevices }
}