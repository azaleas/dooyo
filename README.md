# Unsplash random image demo

- [Unsplash random image demo](#unsplash-random-image-demo)
  - [What was used](#what-was-used)
  - [How to setup and run locally](#how-to-setup-and-run-locally)
  - [Testing](#testing)
  - [On memory](#on-memory)
  - [What to improve](#what-to-improve)

This demo fetches a random image from unsplash API every 2 seconds on average. There're 3 buttons that do the following:

- Pause - pauses the interval timer
- Play - resumes the interval timer
- Revert - uses the memory/cache to show the latest 5 images that were fetched

## What was used

- pnpm - as faster alternative to npm. Version used is `8.6.11`.
- node - version used `20.5.0`.
- vite - project was scaffolded / boostrapped via `pnpm create vite projectName  --template react`.
- playwright - for testing.

## How to setup and run locally

- run `pnpm install` (or `npm install`) to install all the deps
- duplicate `.env.example` file and rename it as `.env.local`
- add your unsplash API key in `.env.local`
- run `pnpm run dev` (or `npm run dev`) to run the dev server
- run `pnpm run test` (or `npn run test`) to run the playwright tests. To run just for one browser, run `pnpm run test --project=chromium` (or `npm run test --project=chromium`).

## Testing

All tests are located in `/tests` folder. Playwright was chosen to run the actual e2e testing in the browser environment (vs JSDom or alike). With parallel worker threads, the tests run smoothly on a decent machine. As such, they provide better and more actual/realistic results for the limited investment made.

Due to API restrictions, the `mockData.js` file is used. It contains an array of json responses from unsplash. Playwright listens to the API calls and returns a random json response from the array.

The default test script would run the tests in 3 browser engines. If you want to run it in just one, use `pnpm run test --project=chromium` (or `npm run test --project=chromium`). Check `playwright.config.js`` for other available browsers/projects.

Tests use the MutationObserver heavily to track the image src changes. This was chosen due to the unpredictable nature of timeouts in the browser. While the setInterval does run on average every 2 seconds in the testing, it would never be accurate enough due to micro task queue running the promises, render queue and React's own udpates.

## On memory

We save up to 5 images in memory. The currently shown/rendered image doesn't go to memory right away.

For example:

- we load the app
- wait to see 3 images
- click `Revert` button
- memory would have 2 images, with third image still being rendered

1 -> 2 -> 3 (revert) -> 2 -> 1 -> No memory left

## What to improve

From smallest to more challenging:

- Move the img and message span elements into their own components and do perf benchmarks to see if having them memoized would be cost efficient against the renders. Buttons are memoized to avoid the recreation of onClick callbacks every time and causing the extra renders.

- Switch from built in Array to Custom Queue - Currently we use `Array.prototype.shift()` to drop the oldest image from the memory when adding the newest/latest image to the memory, limited to 5 images. This is not performant because every time Array would be copied internally, with new indexes re-arranged. We can create a Double Ended Queue to make the enqueue/dequeue operations more performant and avoid any copying. This would also mean a custom Node to store the information.

- Use web workers to do parallel downloading of images - looks like unsplash API's random query endpoint does support requesting up to 30 image URLs in one go. We can utilize web workers to fetch these images in parallel thread, away from the main thread. We can delay our initial app image request to get at least 2-4 images downloaded and then workers can continue downloading assets in the background, feeding an image at a time every time app's timer asks for one. We can also use Array Buffer to transfer the images between web workers to speed it up and store the images either as blob urls or base64 assets.

Other parts to possibly improve on:

- Styling
- A state manager to keep the logic - while the current implementation handles the task just fine, the logic is tighlty coupled to UI. As such, we don't have a direct access to the logic when doing the testing (don't know which internal function might have been called or internal state/hook might have been changed). We can use something like effector, nano stores or alike to keep the business logic isolated. Then use vitest or similar to run unit tests against the [state/store alone, decoupled from UI](https://effector.dev/docs/api/effector/fork).
- Benchmark the switch from setInterval to requestAnimationFrame or other alternative to improve the timer scheduling.
