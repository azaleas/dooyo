import DownloadWorker from './downloadWorker?worker'

let IMAGES = []

const downloadWorkers = []
const NUMBER_OF_IMAGES = 5
const CLIENT_ID = import.meta.env.VITE_UNSPLASH_CLIENT_ID
let mockData = []

const controller = new AbortController()
try {
  const response = await fetch(
    `https://api.unsplash.com/photos/random?query=dolphin&&count=${NUMBER_OF_IMAGES}&client_id=${CLIENT_ID}`,
    {
      signal: controller.signal
    }
  )
  mockData = await response.json()
  mockData = mockData.map(item => `${item.urls.raw}?q=75&fm=jpg&w=500&fit=max`)
} catch (error) {
  console.error(error)
  controller.abort()
}

for (let i = 0; i < NUMBER_OF_IMAGES; i++) {
  const downloadWorker = new DownloadWorker()
  downloadWorker.addEventListener('message', event => {
    const { message, arrayBuffer } = event.data

    if (message === 'Image') {
      IMAGES.push(arrayBuffer)
    }
  })
  downloadWorkers.push(downloadWorker)
}

const getImages = () => {
  for (let i = 0; i < 5; i++) {
    downloadWorkers[i].postMessage({
      message: 'Start downloading',
      url: mockData[i]
    })
  }
}

self.onmessage = event => {
  if (event.data === 'Start the engines...') {
    if (IMAGES.length === 0) {
      getImages()
    }
  }
  if (event.data === 'Give me some...') {
    if (IMAGES.length !== 0) {
      const item = IMAGES.pop()
      self.postMessage(
        {
          message: "Here's an image",
          arrayBuffer: item
        },
        [item]
      )
    }
    if (IMAGES.length < 2) {
      getImages()
    }
  }
}
