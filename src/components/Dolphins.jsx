import { useState, useRef, useEffect, useCallback } from 'react'
import { useInterval } from '../hooks'
import { Button } from './Button'
import MainWorker from './../workers/worker?worker'

export const Dolphins = () => {
  const memory = useRef([])
  const mainWorker = useRef(null)
  const [imageUrl, setImageUrl] = useState()
  const [isIntervalPlaying, setIsIntervalPlaying] = useState(false)
  const [useMemory, setUseMemory] = useState(false)
  const [memoryMessage, setMemoryMessage] = useState('')

  useInterval(
    async () => {
      if (!useMemory) {
        try {
          mainWorker.current.postMessage('Give me some...')
          mainWorker.current.onmessage = event => {
            const { message, arrayBuffer } = event.data
            if (message === "Here's an image") {
              const blob = new Blob([arrayBuffer], {
                type: 'image/jpeg'
              })
              const image = URL.createObjectURL(blob)
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
            }
          }
        } catch (error) {
          console.error(error)
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
    mainWorker.current = new MainWorker()

    mainWorker.current.postMessage('Start the engines...')

    setIsIntervalPlaying(true)

    return () => {
      mainWorker.current?.terminate()
    }
  }, [])

  const handlePause = useCallback(() => {
    setIsIntervalPlaying(false)
  }, [])

  const handlePlay = useCallback(() => {
    if (!mainWorker.current) {
      mainWorker.current = new MainWorker()
      mainWorker.current.postMessage('Start the engines...')
    }
    setMemoryMessage('')
    setIsIntervalPlaying(true)
  }, [])

  const handleRevert = useCallback(() => {
    setUseMemory(true)
    setIsIntervalPlaying(true)
  }, [])

  const handleStop = () => {
    setIsIntervalPlaying(false)
    mainWorker.current?.terminate()
    mainWorker.current = null
  }

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
        <Button testId="stopBtn" onClick={handleStop}>
          Stop
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
