# Product catalog

A TypeScript React Native catalog for [DummyJSON](https://dummyjson.com). The feed pages products, searches as you type, and filters by category, price, and rating. Product details and add-to-cart stay available from the last saved catalog when the device is offline.

Node 22.11 or newer is required.

## Run

Install JavaScript dependencies, then install the iOS pods. Run the pod install again after any native dependency change.

```sh
npm install
bundle install
bundle exec pod install
```

Start Metro, then launch a simulator or a connected device from a second terminal:

```sh
npm start
npm run ios
npm run android
```

## Checks

`npm run ci` runs ESLint, `tsc --noEmit`, and Jest with the 70% coverage gate. The Husky `pre-commit` hook runs that same script.

```sh
npm test
npm run ci
```

## Architecture

Feature folders own catalog, product detail, cart, and network. They reach each other through each feature's public `index.ts`. Shared code holds the DummyJSON client, the Redux store, and Realm.

Launch opens the local Realm database synchronously, copies plain objects into the RTK Query cache, and paints that cache before the network responds. Background revalidation writes the fresh catalog back into Realm.

Add to cart always stores a `QueuedAction` row in Realm. While online, the app posts it immediately and deletes the row on success. On reconnect, the `flushQueue` mutation replays the remaining rows in order.

The product list is a FlashList v2 on the new architecture. Rows are memoized `ProductCard`s, fed plain objects rather than live Realm results, with a fixed 72×72 image and a stable key from the product id.
