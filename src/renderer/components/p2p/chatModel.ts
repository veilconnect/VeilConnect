import type { ChunkAssembler, FileOfferMeta } from '../../../web/fileTransfer/fileTransfer';

export interface Message {
  id: string;
  text: string;
  type: 'sent' | 'received' | 'system';
  timestamp: number;
}

export interface SelfIdentity {
  userId: string;
  publicKey: string;
  boxPublicKey?: string;
  keyBindingSignature?: string;
  nickname: string;
}

export type SecureStatus = 'idle' | 'pending' | 'secure' | 'failed';

export type FileTransferStatus = 'sending' | 'receiving' | 'completed' | 'failed' | 'cancelled';
export type FileTransferDirection = 'sent' | 'received';

export interface FileTransferView {
  id: string;
  direction: FileTransferDirection;
  name: string;
  size: number;
  mime: string;
  progress: number;
  status: FileTransferStatus;
  url?: string;
  error?: string;
}

export interface ReceivingFile {
  meta: FileOfferMeta;
  key: CryptoKey;
  assembler: ChunkAssembler;
  lastPct?: number;
}
