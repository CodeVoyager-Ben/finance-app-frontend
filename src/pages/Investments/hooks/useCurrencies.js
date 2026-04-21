import { useState, useEffect, useCallback } from 'react'
import { getExchangeRates, getLatestRates } from '../../../api/finance'

export default function useCurrencies() {
  const [rates, setRates] = useState([])
  const [latestRates, setLatestRates] = useState([])

  const loadRates = useCallback(async () => {
    try {
      const [allRates, latest] = await Promise.all([
        getExchangeRates(),
        getLatestRates(),
      ])
      setRates(allRates.results || allRates)
      setLatestRates(latest.results || latest)
    } catch (err) {
      console.error('Failed to load exchange rates:', err)
    }
  }, [])

  useEffect(() => {
    loadRates()
  }, [loadRates])

  return { rates, latestRates, loadRates }
}
