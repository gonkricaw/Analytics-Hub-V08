import { NextApiRequest } from 'next'
import { NextApiResponseServerIO, initializeSocketIO } from '@/lib/websocket'

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (req.method === 'POST') {
    // Initialize Socket.IO server if not already initialized
    const io = initializeSocketIO(res.socket.server)
    
    res.status(200).json({ success: true, message: 'Socket.IO server initialized' })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}