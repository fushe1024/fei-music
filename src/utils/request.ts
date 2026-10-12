import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'

/** 后端统一响应结构：成功时 code 为 200，业务数据在各自字段里（result / data / playlists…） */
export interface ApiEnvelope {
  code?: number
  message?: string
  msg?: string
}

const SUCCESS_CODE = 200

/** 统一的请求错误 */
export class ApiError extends Error {
  /** 业务 code，或 HTTP 状态码；取消为 -2，超时为 -3 */
  readonly code: number
  readonly status?: number
  readonly url?: string

  constructor(
    message: string,
    options: {
      code?: number
      status?: number
      url?: string
      cause?: unknown
    } = {}
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code ?? options.status ?? -1
    this.status = options.status
    this.url = options.url
    if (options.cause !== undefined) {
      this.cause = options.cause
    }
  }
}

export const baseURL = import.meta.env.VITE_API_BASE_URL
export const timeout = Number(import.meta.env.VITE_API_TIMEOUT ?? 15000)
/** 接口要求额外带 realIP，这里作为全局公共参数附加，可用 VITE_REAL_IP 覆盖 */
export const realIP = import.meta.env.VITE_REAL_IP ?? '116.25.146.177'

if (!baseURL) {
  console.warn(
    '[request] 未读取到 VITE_API_BASE_URL，请在根目录 .env 中配置接口地址'
  )
}

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout,
  /** 按 NeteaseCloudMusicApi 的约定带 cookie：不带时部分接口会 301；开发环境走 Vite 同源代理 */
  withCredentials: true,
  headers: { Accept: 'application/json' }
})

http.interceptors.request.use((config) => {
  // 公共参数：realIP（Vercel 部署必须）；调用方显式传的同名参数优先
  if (realIP) {
    config.params = { realIP, ...(config.params ?? {}) }
  }
  return config
})

http.interceptors.response.use(
  (response: AxiosResponse) => {
    const payload = response.data
    if (isEnvelope(payload) && payload.code !== SUCCESS_CODE) {
      return Promise.reject(
        new ApiError(
          payload.message ?? payload.msg ?? `接口返回 code=${payload.code}`,
          {
            code: payload.code,
            status: response.status,
            url: response.config.url
          }
        )
      )
    }
    // 直接返回 body：调用方拿到的就是接口数据
    return payload
  },
  async (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      shouldRetry(error, error.config as RetryableConfig | undefined)
    ) {
      const config = error.config as RetryableConfig
      const attempt = config.__retryCount ?? 0
      config.__retryCount = attempt + 1
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]))
      return http.request(config)
    }
    return Promise.reject(toApiError(error))
  }
)

/** 类型化的快捷方法：返回值即接口 body（不再包一层 AxiosResponse） */
export const request = {
  get: <T>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ) => http.get<T, T>(url, { params, ...config }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    http.post<T, T>(url, data, config),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    http.put<T, T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    http.delete<T, T>(url, config)
}

export function isEnvelope(
  payload: unknown
): payload is ApiEnvelope & { code: number } {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof (payload as ApiEnvelope).code === 'number'
  )
}

/** 请求被主动取消（组件卸载、重新发起）时的错误，页面通常应忽略 */
export function isCanceledError(error: unknown): boolean {
  return error instanceof ApiError && error.code === -2
}

/** GET 遇到网络抖动时退避重试两次（HTTP 错误码不重试） */
const RETRY_DELAYS = [300, 900]

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number
}

function shouldRetry(error: AxiosError, config?: RetryableConfig): boolean {
  const attempt = config?.__retryCount ?? 0
  if (!config || attempt >= RETRY_DELAYS.length) {
    return false
  }
  if ((config.method ?? 'get').toLowerCase() !== 'get') {
    return false
  }
  if (error.response) {
    // 有响应说明是 HTTP 层错误，重试也没用
    return false
  }
  return error.code !== 'ERR_CANCELED'
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiEnvelope>
    const url = axiosError.config?.url
    if (axiosError.code === 'ERR_CANCELED') {
      return new ApiError('请求已取消', { code: -2, url, cause: error })
    }
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return new ApiError(`请求超时（${timeout}ms）`, {
        code: -3,
        url,
        cause: error
      })
    }
    const status = axiosError.response?.status
    const body = axiosError.response?.data
    const detail = body?.message ?? body?.msg ?? axiosError.message
    return new ApiError(
      status ? `请求失败（HTTP ${status}）：${detail}` : detail,
      {
        status,
        url,
        cause: error
      }
    )
  }
  return new ApiError(error instanceof Error ? error.message : '未知错误', {
    cause: error
  })
}

export default request
