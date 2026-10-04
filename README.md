# Product catalog

A TypeScript React Native catalog for [DummyJSON](https://dummyjson.com). The feed pages products, searches as you type, and filters by category, price, and rating. Product details and add-to-cart stay available from the last saved catalog when the device is offline.

Node 22.11 or newer is required.

## Run

Install JavaScript dependencies once from the repository root. Both platforms load the JavaScript bundle from Metro, so start that first and leave it running. The catalog calls DummyJSON, so the simulator or emulator needs a network connection.

```sh
npm install
npm start
```

Open a second terminal for the platform below. The first launch compiles native modules such as Realm, so it takes longer than later ones.

### iOS

iOS needs Xcode and CocoaPods. The `Gemfile` at the repository root pins CocoaPods for Ruby 2.6.10 or newer. Install those gems from the root, then install the pods from `ios/`, where the Podfile lives. Run `pod install` again after any native dependency change.

```sh
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

`npm run ios` builds `ios/caseStudyRNApp.xcworkspace` and opens the default simulator. Metro in the first terminal serves the bundle.

### Android

Android needs Android Studio, a JDK, and either a running emulator or a device with USB debugging enabled. The build uses the Gradle wrapper in `android/`.

```sh
npm run android
```

`npm run android` compiles the app, installs it, and launches it on the running emulator or connected device. Metro in the first terminal serves the bundle.

## Checks

`npm run ci` runs ESLint, `tsc --noEmit`, and Jest with the 70% coverage gate.

**Git hooks:** the Husky `pre-commit` hook runs that same script, demonstrating how CI would work before a commit is created.

Unit and integration tests are in place and cover at least 70% of `src`. Mock and UI tests are included as well: Jest stand-ins for Realm, FlashList, and NetInfo, plus React Native Testing Library screen tests. End-to-end tests are not included.

```sh
npm test
npm run ci
```

## Architecture

Feature folders own catalog, product detail, cart, and network. Shared code holds the DummyJSON client, the Redux store, and Realm. The planning notes are in [docs/architecture.md](docs/architecture.md).

### Local caching and instant hydration

Launch opens the local Realm file before the first screen renders. Saved products, categories, and the latest feed are copied into the RTK Query cache as plain objects, so the feed and product details paint from that cache instead of waiting on DummyJSON. A successful fetch writes the same rows back with an upsert. The next cold start can show the last catalog immediately, then refresh it in the background while the device is online.

### Offline queue persistence and reconnection handling

Add to cart was not part of the requirements. It is included so the persisted offline queue has a real action to store and replay. Each tap inserts a `QueuedAction` row in Realm before it tries the network. While online, the app posts that row immediately and deletes it only after DummyJSON accepts it. If the device is offline or the post fails, the row stays and the product remains queued. A reachability probe updates online state on a timer, on network changes, and when the app becomes active. Coming back online replays the remaining rows in the order they were created and stops at the first failure, leaving the rest for the next reconnect.

### Virtualized list rendering

The product feed is a FlashList v2 on the new architecture, paged at 20 items. Each row is a memoized `ProductCard` with a stable `renderItem` callback, so unchanged cards are not redrawn while the shopper types or scrolls. Rows are plain objects from the cache, not live Realm results, and each one is keyed by product id. Thumbnails are a fixed 72×72, which keeps row height stable while cells are recycled. The next page is appended when the list nears the end, and a new search or filter starts again at the top.
