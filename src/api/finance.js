import request from './request'

// Accounts
export const getAccounts = (params) => request.get('/accounts/', { params })
export const createAccount = (data) => request.post('/accounts/', data)
export const updateAccount = (id, data) => request.patch(`/accounts/${id}/`, data)
export const deleteAccount = (id) => request.delete(`/accounts/${id}/`)

// Categories
export const getCategories = (params) => request.get('/categories/', { params })
export const createCategory = (data) => request.post('/categories/', data)
export const updateCategory = (id, data) => request.patch(`/categories/${id}/`, data)
export const deleteCategory = (id) => request.delete(`/categories/${id}/`)

// Transactions
export const getTransactions = (params) => request.get('/transactions/', { params })
export const createTransaction = (data) => request.post('/transactions/', data)
export const updateTransaction = (id, data) => request.patch(`/transactions/${id}/`, data)
export const deleteTransaction = (id) => request.delete(`/transactions/${id}/`)
export const getDailySummary = (params) => request.get('/transactions/daily_summary/', { params })
export const getMonthlySummary = (params) => request.get('/transactions/monthly_summary/', { params })
export const getCategorySummary = (params) => request.get('/transactions/category_summary/', { params })
export const getDashboard = () => request.get('/transactions/dashboard/')

// Investments
export const getInvestmentAccounts = (params) => request.get('/investments/', { params })
export const createInvestmentAccount = (data) => request.post('/investments/', data)
export const updateInvestmentAccount = (id, data) => request.patch(`/investments/${id}/`, data)
export const deleteInvestmentAccount = (id) => request.delete(`/investments/${id}/`)
export const getAccountSummary = (id) => request.get(`/investments/${id}/summary/`)
export const searchSecurity = (q) => request.get('/investments/security-lookup/', { params: { q } })

export const getHoldings = (params) => request.get('/holdings/', { params })
export const createHolding = (data) => request.post('/holdings/', data)
export const updateHolding = (id, data) => request.patch(`/holdings/${id}/`, data)
export const getInvestDashboard = () => request.get('/holdings/dashboard/')
export const batchUpdatePrices = (data) => request.post('/holdings/batch_update_prices/', data)
export const autoUpdatePrices = () => request.post('/holdings/auto-update-prices/')
export const getDailySnapshots = (params) => request.get('/holdings/daily-snapshots/', { params })

export const getInvestTransactions = (params) => request.get('/invest-trans/', { params })
export const createInvestTransaction = (data) => request.post('/invest-trans/', data)
export const updateInvestTransaction = (id, data) => request.patch(`/invest-trans/${id}/`, data)
export const deleteInvestTransaction = (id) => request.delete(`/invest-trans/${id}/`)

// Asset Types
export const getAssetTypes = () => request.get('/asset-types/')
export const createAssetType = (data) => request.post('/asset-types/', data)
export const updateAssetType = (id, data) => request.patch(`/asset-types/${id}/`, data)
export const deleteAssetType = (id) => request.delete(`/asset-types/${id}/`)

// Exchange Rates
export const getExchangeRates = (params) => request.get('/exchange-rates/', { params })
export const createExchangeRate = (data) => request.post('/exchange-rates/', data)
export const deleteExchangeRate = (id) => request.delete(`/exchange-rates/${id}/`)
export const getLatestRates = () => request.get('/exchange-rates/latest/')

// Dividend Records
export const getDividendRecords = (params) => request.get('/dividend-records/', { params })
export const createDividendRecord = (data) => request.post('/dividend-records/', data)
export const updateDividendRecord = (id, data) => request.patch(`/dividend-records/${id}/`, data)
export const deleteDividendRecord = (id) => request.delete(`/dividend-records/${id}/`)

// Reports
export const getBalanceSheet = (params) => request.get('/reports/balance-sheet/', { params })
export const getNetWorthHistory = (params) => request.get('/reports/net-worth-history/', { params })
export const getExportUrl = (type, params) => {
  const searchParams = new URLSearchParams({ type, ...params }).toString()
  return `/api/reports/export/?${searchParams}`
}

// Budgets
export const getBudgets = (params) => request.get('/budgets/', { params })
export const createBudget = (data) => request.post('/budgets/', data)
export const updateBudget = (id, data) => request.patch(`/budgets/${id}/`, data)
export const deleteBudget = (id) => request.delete(`/budgets/${id}/`)

// Lending Records
export const getLendingRecords = (params) => request.get('/lending-records/', { params })
export const createLendingRecord = (data) => request.post('/lending-records/', data)
export const updateLendingRecord = (id, data) => request.patch(`/lending-records/${id}/`, data)
export const deleteLendingRecord = (id) => request.delete(`/lending-records/${id}/`)
export const getLendingSummary = () => request.get('/lending-records/summary/')

// Repayments
export const getRepayments = (params) => request.get('/repayments/', { params })
export const createRepayment = (data) => request.post('/repayments/', data)
