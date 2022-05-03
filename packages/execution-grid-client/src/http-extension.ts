declare module 'http' {
  interface IncomingMessage {
    body?: Record<string, any>
    retry?: number
  }

  interface ServerResponse {
    body?: Record<string, any>
  }
}
