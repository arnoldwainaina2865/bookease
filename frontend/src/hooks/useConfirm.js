import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

export function useConfirm() {
  const [options, setOptions] = useState(null)
  const resolverRef = useRef(null)

  const confirm = useCallback((configuration) => {
    if (resolverRef.current) {
      return Promise.resolve(false)
    }

    return new Promise((resolve) => {
      resolverRef.current = resolve

      setOptions(
        typeof configuration === 'string'
          ? { message: configuration }
          : configuration
      )
    })
  }, [])

  const settle = useCallback((result) => {
    const resolve = resolverRef.current

    resolverRef.current = null
    setOptions(null)

    resolve?.(result)
  }, [])

  useEffect(() => {
    return () => {
      resolverRef.current?.(false)
      resolverRef.current = null
    }
  }, [])

  return {
    confirm,
    dialogProps: {
      ...options,
      open: options !== null,
      onConfirm: () => settle(true),
      onCancel: () => settle(false),
    },
  }
}
