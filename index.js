/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { openCatalogRepository } from './src/shared/db/realm';

openCatalogRepository();

AppRegistry.registerComponent(appName, () => App);
