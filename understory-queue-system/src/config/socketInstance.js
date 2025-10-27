let io = null;

/**
 * Initialiserer Socket.IO én gang (kaldes i app.js)
 */
export function initSocketIO(serverIO) {
  io = serverIO;
  console.log("🔌 Socket.IO initialiseret globalt");
}

/**
 * Hent Socket.IO-instanse hvor som helst i appen
 */
export function getIO() {
  if (!io) {
    throw new Error("Socket.IO er ikke initialiseret endnu!");
  }
  return io;
}
