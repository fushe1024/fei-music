/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 接口基地址，例如 https://fei-music-api.fushe.online/ */
  readonly VITE_API_BASE_URL: string
  /** 请求超时（毫秒） */
  readonly VITE_API_TIMEOUT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
