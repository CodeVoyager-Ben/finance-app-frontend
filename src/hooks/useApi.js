import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 通用数据加载 hook：封装 loading/error/data 模式
 * @param {Function} fetchFn - 返回 Promise 的数据获取函数
 * @param {Array} deps - 触发重新加载的依赖数组
 * @returns {{ data, loading, error, reload }}
 */
export default function useApi(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      if (mountedRef.current) setData(result)
    } catch (e) {
      if (mountedRef.current) setError(e)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => { mountedRef.current = false }
  }, [load])

  return { data, loading, error, reload: load }
}
