import { useState, useEffect, useCallback } from 'react'
import {
  getInvestmentAccounts, getHoldings, getInvestTransactions,
  getInvestDashboard, getDividendRecords, getAssetTypes,
} from '../../../api/finance'

export default function useInvestmentData() {
  const [accounts, setAccounts] = useState([])
  const [holdings, setHoldings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [dividends, setDividends] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [assetTypes, setAssetTypes] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [accs, hold, trans, dash, divs, types] = await Promise.all([
        getInvestmentAccounts(),
        getHoldings(),
        getInvestTransactions(),
        getInvestDashboard(),
        getDividendRecords(),
        getAssetTypes(),
      ])
      setAccounts(accs.results || accs)
      setHoldings(hold.results || hold)
      setTransactions(trans.results || trans)
      setDashboard(dash)
      setDividends(divs.results || divs)
      setAssetTypes(types.results || types)
    } catch (err) {
      console.error('Failed to load investment data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    accounts, holdings, transactions, dividends, dashboard, assetTypes,
    loading, loadData,
  }
}
