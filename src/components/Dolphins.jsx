import { useState, useRef, useEffect, useCallback } from 'react'
import { useInterval } from '../hooks'
import { Button } from './Button'

const CLIENT_ID = import.meta.env.VITE_UNSPLASH_CLIENT_ID

export const Dolphins = () => {
  const memory = useRef([])
  const [imageUrl, setImageUrl] = useState()
  const [isIntervalPlaying, setIsIntervalPlaying] = useState(false)
  const [useMemory, setUseMemory] = useState(false)
  const [memoryMessage, setMemoryMessage] = useState('')
  const controller = useRef(new AbortController())

  useInterval(
    async () => {
      if (!useMemory) {
        try {
          const response = await fetch(
            `https://api.unsplash.com/photos/random?query=dolphin&client_id=${CLIENT_ID}`,
            controller.current.signal
          )
          const data = await response.json()
          const image = `${data.urls.raw}?q=75&fm=jpg&w=500&fit=max`
          if (!imageUrl) {
            setImageUrl(image)
            return
          }
          // If new image is the same as the one already rendered we skip it
          if (imageUrl !== image) {
            // memory always trails by 1 image because current image will be rendered directly
            memory.current.push(imageUrl)
            setImageUrl(image)
          }
          if (memory.current.length > 5) {
            memory.current.shift()
          }
        } catch (error) {
          console.error(error)
          controller.current.abort()
        }
      } else {
        if (memory.current.length === 0) {
          setUseMemory(false)
          setIsIntervalPlaying(false)
          setImageUrl(null)
          setMemoryMessage('Cannot remember anymore')
        } else {
          setImageUrl(memory.current.pop())
        }
      }
    },
    isIntervalPlaying ? 2000 : null
  )

  useEffect(() => {
    setIsIntervalPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    controller.current.abort()
    setIsIntervalPlaying(false)
  }, [])

  const handlePlay = useCallback(() => {
    setMemoryMessage('')
    setIsIntervalPlaying(true)
  }, [])

  const handleRevert = useCallback(() => {
    controller.current.abort()
    setUseMemory(true)
    setIsIntervalPlaying(true)
  }, [])

  return (
    <div className="container">
      <div className="buttons">
        <Button testId="pauseBtn" onClick={handlePause}>
          Pause
        </Button>
        <Button testId="playBtn" onClick={handlePlay}>
          Play
        </Button>
        <Button testId="revertBtn" onClick={handleRevert}>
          Revert
        </Button>
      </div>
      {imageUrl && (
        <img
          data-testid="dolphinImg"
          src={imageUrl}
          alt="Random Dolphon image"
        />
      )}
      {memoryMessage && (
        <span data-testid="memoryMessage">{memoryMessage}</span>
      )}
    </div>
  )
}
