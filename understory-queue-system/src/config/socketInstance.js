let io = null;

export function initSocketIO(serverIO) {
  io = serverIO;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO er ikke initialiseret endnu!");
  return io;
}
