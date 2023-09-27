# Unsplash random image demo

- [Unsplash random image demo](#unsplash-random-image-demo)
  - [What was used](#what-was-used)
  - [How to setup and run locally](#how-to-setup-and-run-locally)
  - [Testing](#testing)
  - [On memory](#on-memory)

This demo fetches a random image from unsplash API every 2 seconds on average. There're 4 buttons that do the following:

- Pause - pauses the interval timer
- Play - resumes the interval timer. Also resumes the workers if they were terminated.
- Revert - uses the memory/cache to show the latest 5 images that were shown
- Stop - terminates the workers.

The current implementation uses web workers to download the images in the background. Main worker initiates subworkers to download images, which are then sent to the main worker as transferable objects to be cached. Once app starts requesting images per the set interval, main worker would send the images from it's own cache to the app. App is then responsible to convert the transferrred array buffer into a blob which is then used as img src with blob URL.

## What was used

- pnpm - as faster alternative to npm. Version used is `8.6.11`.
- node - version used `20.5.0`.
- vite - project was scaffolded / boostrapped via `pnpm create vite projectName  --template react`.
- playwright - for testing. Version used `1.38.1`.

## How to setup and run locally

- run `pnpm install` (or `npm install`) to install all the deps
- duplicate `.env.example` file and rename it as `.env.local`
- add your unsplash API key in `.env.local`
- run `pnpm run dev` (or `npm run dev`) to run the dev server
- run `pnpm run test` (or `npn run test`) to run the playwright tests. To run just for one browser, run `pnpm run test --project=chromium` (or `npm run test --project=chromium`).

## Testing

All tests are located in `/tests` folder. Playwright was chosen to run the actual e2e testing in the browser environment (vs JSDom or alike). With parallel worker threads, the tests run smoothly on a decent machine. As such, they provide better and more actual/realistic results for the limited investment made.

Due to API restrictions, the `mockData.js` file is used. It contains an array of json responses from unsplash. Playwright listens to the API calls and returns a random json response from the array.

The default test script would run the tests in 3 browser engines. If you want to run it in just one, use `pnpm run test --project=firefox` (or `npm run test --project=firefox`). Check `playwright.config.js`` for other available browsers/projects.

Currently there's a bug with chromium when using page.route on fetches that are initiated within sub workers. Bug [reported](https://github.com/microsoft/playwright/issues/27376) to playwright.

Tests use the MutationObserver heavily to track the image src changes. This was chosen due to the unpredictable nature of timeouts in the browser. While the setInterval does run on average every 2 seconds in the testing, it would never be accurate enough due to micro task queue running the promises, render queue and React's own udpates.

## On memory

We save up to 5 images in memory. The currently shown/rendered image doesn't go to memory right away.

For example:

- we load the app
- wait to see 3 images
- click `Revert` button
- memory would have 2 images, with third image still being rendered

1 -> 2 -> 3 (revert) -> 2 -> 1 -> No memory left
