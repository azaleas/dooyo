self.onmessage = async event => {
  const controller = new AbortController()
  const { message, url } = event.data
  if (message === 'Start downloading') {
    try {
      const response = await fetch(url, {
        signal: controller.signal
      })
      const arrayBuffer = await response.arrayBuffer()
      self.postMessage(
        {
          message: 'Image',
          arrayBuffer: arrayBuffer
        },
        [arrayBuffer]
      )
    } catch (error) {
      console.error(error)
      controller.abort()
    }
  }
}
