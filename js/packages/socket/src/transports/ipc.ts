import {type Transport} from '../transport'
import {type Socket} from 'net'

export const transport: Transport<Socket> = {
  isReady(socket) {
    return !(socket as any).pending
  },
  onReady(socket, callback) {
    socket.on('ready', callback)
    return () => socket.off('ready', callback)
  },
  onMessage(socket, callback) {
    const handler = (data: string | Uint8Array) => splitMessages(data).forEach(data => callback(data))
    socket.on('data', handler)
    return () => socket.off('data', handler)
  },
  onClose(socket, callback) {
    socket.on('close', callback)
    return () => socket.off('close', callback)
  },
  onError(socket, callback) {
    socket.on('error', callback)
    return () => socket.off('error', callback)
  },
  send(socket, data) {
    socket.write(data)
  },
  format(data) {
    const header = Buffer.allocUnsafe(4)
    const buffer = Buffer.from(data)
    header.writeUint32BE(buffer.byteLength)
    const format = Buffer.concat([header, buffer])
    return format
  },
}

function splitMessages(data: Uint8Array | string): Uint8Array[] {
  const buffer = Buffer.from(data)
  const messages = [] as Uint8Array[]
  let offset = 0
  while (offset < buffer.length) {
    const messageLength = buffer.readUInt32BE(offset)
    offset += 4
    messages.push(buffer.slice(offset, offset + messageLength))
    offset += messageLength
  }
  return messages
}

export default transport
