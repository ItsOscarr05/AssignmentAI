const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

interface WebSocketTransport {
  createConnection: () => WebSocket;
  pingInterval: number;
}

export const createWebSocketConnection = (options: {
  socketProtocol: string;
  socketHost: string;
  wsToken: string;
  hmrTimeout: number;
}): WebSocketTransport => {
  const { socketProtocol, socketHost, wsToken, hmrTimeout } = options;
  let retryCount = 0;

  const createConnection = () => {
    const ws = new WebSocket(`${socketProtocol}://${socketHost}?token=${wsToken}`, 'vite-hmr');

    ws.addEventListener('open', () => {
      console.log('WebSocket connection established');
      retryCount = 0;
    });

    ws.addEventListener('error', error => {
      console.error('WebSocket connection error:', error);
    });

    ws.addEventListener('close', event => {
      console.log('WebSocket connection closed:', event);

      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Attempting to reconnect (${retryCount}/${MAX_RETRIES})...`);
        setTimeout(() => {
          createConnection();
        }, RETRY_DELAY);
      } else {
        console.error('Max reconnection attempts reached');
      }
    });

    return ws;
  };

  return {
    createConnection,
    pingInterval: hmrTimeout,
  };
};
