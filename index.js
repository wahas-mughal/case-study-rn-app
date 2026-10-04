/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { hydrateCatalog } from './src/app/store/hydrate';
import { store } from './src/app/store/store';
import { listenToNetwork } from './src/features/network';
import { openCatalogRepository } from './src/shared/db/realm';

openCatalogRepository();
hydrateCatalog(store.dispatch);
listenToNetwork(store.dispatch);

AppRegistry.registerComponent(appName, () => App);
