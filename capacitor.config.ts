import type { CapacitorConfig } from '@capacitor/cli';

// This app is fully server-rendered (Supabase auth, server actions) --
// it can't be statically exported into the native shell like a typical
// Capacitor app. Instead the native shell just loads the live deployed
// site in its WebView, same as how a native app wraps a web view around
// a company's existing website. `webDir` is required by the CLI but
// unused in this mode.
const config: CapacitorConfig = {
  appId: 'com.louisgirardin.shelf',
  appName: 'Shelf',
  webDir: 'public',
  server: {
    url: 'https://bookapp-tau-rose.vercel.app',
    cleartext: false,
  },
};

export default config;
