// polyfills.js - Node.js polyfills for React Native
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer global
global.Buffer = Buffer;

// Make process global
global.process = process;

// Add process.browser flag
if (!global.process.browser) {
  global.process.browser = true;
}

// Polyfill crypto.getRandomValues if not available
if (typeof global.crypto === 'undefined') {
  global.crypto = {};
}
if (typeof global.crypto.getRandomValues === 'undefined') {
  // react-native-get-random-values will handle this
  console.log('crypto.getRandomValues polyfill loaded');
}
