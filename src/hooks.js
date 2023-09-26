import { useEffect } from 'react'
import { useRef } from 'react'

export const useInterval = (callback, delay) => {
  const timer = useRef(null)
  const cb = useRef()

  useEffect(() => {
    cb.current = callback
  }, [callback])

  useEffect(() => {
    if (delay) {
      timer.current && clearInterval(timer.current)
      timer.current = setInterval(() => {
        cb.current()
      }, delay)
    }
    return () => timer.current && clearInterval(timer.current)
  }, [delay])

  useEffect(() => {
    return () => timer.current && clearInterval(timer.current)
  }, [])
}
