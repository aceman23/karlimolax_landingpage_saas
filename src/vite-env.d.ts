/// <reference types="vite/client" />

declare const __WS_TOKEN__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GOOGLE_PLACES_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
