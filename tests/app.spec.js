import { test, expect } from '@playwright/test'
import { ITEMS } from '../src/mockData'

const CLIENT_ID = process.env.VITE_UNSPLASH_CLIENT_ID

const ROUTE = `https://api.unsplash.com/photos/random?query=dolphin&count=10&client_id=${CLIENT_ID}`

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`)

  testInfo.setTimeout(testInfo.timeout + 90000) // for longer running test cases

  // listen to API calls and return mocked JSON data
  // there's a bug with below code on chromium. Firefox/safari works fine. Iteration just gets stuck as soon as client hits any route
  await page.route('**', route => {
    if (route === ROUTE) {
      const json = ITEMS
      route.fulfill({ json })
    } else {
      route.continue()
    }
  })

  await page.goto('http://localhost:5173')
})

test.describe('Dolphin image viewer', () => {
  test('image becomes visible once component is loaded', async ({ page }) => {
    const imgElement = page.getByTestId('dolphinImg')

    await expect(imgElement).toBeHidden()

    await imgElement.waitFor()

    await expect(imgElement).toBeVisible()
  })

  test('images change on interval', async ({ page }) => {
    const imgElement = page.getByTestId('dolphinImg')

    await imgElement.waitFor()

    await expect(imgElement).toBeVisible()

    const cachedImageSrc = await imgElement.getAttribute('src')

    await imgElement.evaluate(imgElement => {
      return new Promise(resolve => {
        new MutationObserver((mutations, observer) => {
          mutations.every(async item => {
            if (item.type === 'attributes' && item.attributeName === 'src') {
              resolve()
              observer.disconnect()
              return
            }
          })
        }).observe(imgElement, { attributes: true })
      })
    })

    const newImageSrc = await imgElement.getAttribute('src')

    await expect(newImageSrc).not.toMatch(cachedImageSrc)

    // To see the image in UI mode
    await page.waitForTimeout(0)
  })

  test('image loading pauses when Pause is clicked', async ({ page }) => {
    const imgElement = page.getByTestId('dolphinImg')

    await imgElement.waitFor()

    await expect(imgElement).toBeVisible()

    const cachedImageSrc = await imgElement.getAttribute('src')

    const result = await imgElement.evaluate(imgElement => {
      const imageSrcs = []
      return new Promise(resolve => {
        new MutationObserver((mutations, observer) => {
          mutations.every(async item => {
            if (item.type === 'attributes' && item.attributeName === 'src') {
              imageSrcs.push(imgElement.getAttribute(item.attributeName))
            }
            if (imageSrcs.length === 2) {
              resolve(imageSrcs)
              observer.disconnect()
              return
            }
          })
        }).observe(imgElement, { attributes: true })
      })
    })

    await expect(result.length).toBe(2)
    await expect(cachedImageSrc).not.toBe(result[1])
    await expect(await imgElement.getAttribute('src')).toBe(result[1])

    const pauseBtn = page.getByTestId('pauseBtn')
    await expect(pauseBtn).toBeVisible()
    await pauseBtn.click()
    await page.waitForTimeout(3000)

    await expect(await imgElement.getAttribute('src')).toBe(result[1])
  })

  test('image loading continues when Play is clicked', async ({ page }) => {
    const observeAttributeChanges = async element => {
      return await element.evaluate(element => {
        const imageSrcs = []
        return new Promise(resolve => {
          new MutationObserver((mutations, observer) => {
            mutations.every(async item => {
              if (item.type === 'attributes' && item.attributeName === 'src') {
                imageSrcs.push(element.getAttribute(item.attributeName))
              }
              if (imageSrcs.length === 2) {
                resolve(imageSrcs)
                observer.disconnect()
                return
              }
            })
          }).observe(element, { attributes: true })
        })
      })
    }

    const imgElement = page.getByTestId('dolphinImg')

    await imgElement.waitFor()

    await expect(imgElement).toBeVisible()

    const cachedImageSrc = await imgElement.getAttribute('src')

    const resultsBeforePause = await observeAttributeChanges(imgElement)

    const pauseBtn = page.getByTestId('pauseBtn')

    await expect(pauseBtn).toBeVisible()

    await pauseBtn.click()
    await page.waitForTimeout(3000)

    await expect(resultsBeforePause.length).toBe(2)
    await expect(cachedImageSrc).not.toBe(resultsBeforePause[1])
    await expect(await imgElement.getAttribute('src')).toBe(
      resultsBeforePause[1]
    )
    const playBtn = page.getByTestId('playBtn')

    await expect(playBtn).toBeVisible()

    await playBtn.click()

    const resultAfterPlay = await observeAttributeChanges(imgElement)

    await expect(resultAfterPlay.length).toBe(2)
    await expect(resultsBeforePause[1]).not.toBe(resultAfterPlay[1])
    await expect(await imgElement.getAttribute('src')).toBe(resultAfterPlay[1])
  })

  test('images load from the cache in reverse order when Reverse is clicked', async ({
    page
  }) => {
    const observeAttributeChanges = async (
      element,
      oldValues = false,
      numberOfItems = 5
    ) => {
      return await element.evaluate(
        (element, { oldValues, numberOfItems }) => {
          const imageSrcs = []
          return new Promise(resolve => {
            new MutationObserver((mutations, observer) => {
              mutations.every(async item => {
                if (
                  item.type === 'attributes' &&
                  item.attributeName === 'src'
                ) {
                  if (oldValues) {
                    if (item.oldValue) {
                      imageSrcs.push(item.oldValue)
                    }
                  } else {
                    const src = element.getAttribute(item.attributeName)
                    imageSrcs.push(src)
                  }
                }
                if (imageSrcs.length === numberOfItems) {
                  console.log('VALUE', oldValues)
                  resolve(imageSrcs)
                  observer.disconnect()
                  return
                }
              })
            }).observe(element, { attributes: true, attributeOldValue: true })
          })
        },
        { oldValues, numberOfItems }
      )
    }

    const revertBtn = page.getByTestId('revertBtn')

    await expect(revertBtn).toBeVisible()

    let imgElement = page.getByTestId('dolphinImg')
    let numberOfItemsInMemory = 5

    await expect(imgElement).toBeHidden()

    let resultsBeforeRevert = await observeAttributeChanges(
      imgElement,
      true,
      numberOfItemsInMemory
    )

    const memoryMessage = page.getByTestId('memoryMessage')

    await expect(resultsBeforeRevert.length).toBe(numberOfItemsInMemory)
    await expect(memoryMessage).toBeHidden()

    await revertBtn.click()

    let resultsAfterRevert = await observeAttributeChanges(
      imgElement,
      false,
      numberOfItemsInMemory
    )

    await expect(resultsAfterRevert.reverse().join('')).toBe(
      resultsBeforeRevert.join('')
    )

    await expect(imgElement).toBeHidden()
    await expect(memoryMessage).toBeVisible()

    const playBtn = page.getByTestId('playBtn')

    numberOfItemsInMemory = 2

    await playBtn.click()
    await expect(memoryMessage).toBeHidden()

    resultsBeforeRevert = await observeAttributeChanges(
      imgElement,
      true,
      numberOfItemsInMemory
    )

    await expect(resultsBeforeRevert.length).toBe(numberOfItemsInMemory)

    await revertBtn.click()

    resultsAfterRevert = await observeAttributeChanges(
      imgElement,
      false,
      numberOfItemsInMemory
    )

    await expect(resultsAfterRevert.reverse().join('')).toBe(
      resultsBeforeRevert.join('')
    )

    await expect(imgElement).toBeHidden()
    await expect(memoryMessage).toBeVisible()
  })
})
