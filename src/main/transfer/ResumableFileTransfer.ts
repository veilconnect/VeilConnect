import { EventEmitter } from 'events';
import { promises as fs, createReadStream } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash, randomBytes } from 'crypto';

export interface FileMetadata {
  fileId: string;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
  checksum: string;
}

export interface FileChunk {
  fileId: string;
  index: number;
  data: Buffer;
}

export interface TransferProgress {
  fileId: string;
  fileName: string;
  totalChunks: number;
  completedChunks: Set<number>;
  bytesTransferred: number;
  totalBytes: number;
  status: 'idle' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled';
}

const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64KB

export class ResumableFileTransfer extends EventEmitter {
  private transfers: Map<string, TransferProgress> = new Map();
  private receiveStaging: Map<string, string> = new Map();
  private stagingRoot: string;

  constructor(stagingRoot?: string) {
    super();
    this.stagingRoot = stagingRoot || path.join(os.tmpdir(), 'veilconnect-transfers');
    fs.mkdir(this.stagingRoot, { recursive: true }).catch(() => undefined);
  }

  private async hashFile(filePath: string): Promise<string> {
    const hash = createHash('sha256');
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });
    return hash.digest('hex');
  }

  async prepareSend(filePath: string, chunkSize: number = DEFAULT_CHUNK_SIZE): Promise<FileMetadata> {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error(`Not a file: ${filePath}`);

    const fileId = randomBytes(16).toString('hex');
    const totalChunks = Math.ceil(stat.size / chunkSize);
    const checksum = await this.hashFile(filePath);

    const metadata: FileMetadata = {
      fileId,
      fileName: path.basename(filePath),
      fileSize: stat.size,
      chunkSize,
      totalChunks,
      checksum
    };

    this.transfers.set(fileId, {
      fileId,
      fileName: metadata.fileName,
      totalChunks,
      completedChunks: new Set<number>(),
      bytesTransferred: 0,
      totalBytes: stat.size,
      status: 'idle'
    });

    return metadata;
  }

  async readChunk(filePath: string, fileId: string, chunkIndex: number): Promise<FileChunk> {
    const progress = this.transfers.get(fileId);
    if (!progress) throw new Error(`Unknown transfer: ${fileId}`);
    if (progress.status === 'paused' || progress.status === 'cancelled') {
      throw new Error(`Transfer ${progress.status}: ${fileId}`);
    }

    const chunkSize = Math.ceil(progress.totalBytes / progress.totalChunks);
    const offset = chunkIndex * chunkSize;
    const length = Math.min(chunkSize, progress.totalBytes - offset);

    const handle = await fs.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, offset);
      return { fileId, index: chunkIndex, data: buffer };
    } finally {
      await handle.close();
    }
  }

  async prepareReceive(metadata: FileMetadata): Promise<string> {
    const stagingPath = path.join(this.stagingRoot, `${metadata.fileId}.part`);
    await fs.writeFile(stagingPath, Buffer.alloc(0));
    this.receiveStaging.set(metadata.fileId, stagingPath);

    this.transfers.set(metadata.fileId, {
      fileId: metadata.fileId,
      fileName: metadata.fileName,
      totalChunks: metadata.totalChunks,
      completedChunks: new Set<number>(),
      bytesTransferred: 0,
      totalBytes: metadata.fileSize,
      status: 'transferring'
    });

    return stagingPath;
  }

  async writeChunk(fileId: string, chunk: FileChunk): Promise<TransferProgress> {
    const stagingPath = this.receiveStaging.get(fileId);
    const progress = this.transfers.get(fileId);
    if (!stagingPath || !progress) throw new Error(`Unknown receive: ${fileId}`);
    if (progress.status === 'paused' || progress.status === 'cancelled') {
      throw new Error(`Transfer ${progress.status}: ${fileId}`);
    }

    const chunkSize = Math.ceil(progress.totalBytes / progress.totalChunks);
    const offset = chunk.index * chunkSize;

    const handle = await fs.open(stagingPath, 'r+').catch(async (err) => {
      if (err.code === 'ENOENT') return fs.open(stagingPath, 'w+');
      throw err;
    });
    try {
      await handle.write(chunk.data, 0, chunk.data.length, offset);
    } finally {
      await handle.close();
    }

    if (!progress.completedChunks.has(chunk.index)) {
      progress.completedChunks.add(chunk.index);
      progress.bytesTransferred += chunk.data.length;
    }

    if (progress.completedChunks.size === progress.totalChunks) {
      progress.status = 'completed';
      this.emit('completed', { fileId, fileName: progress.fileName, stagingPath });
    } else {
      this.emit('progress', { ...progress, completedChunks: Array.from(progress.completedChunks) });
    }

    return progress;
  }

  getMissingChunks(fileId: string): number[] {
    const progress = this.transfers.get(fileId);
    if (!progress) return [];
    const missing: number[] = [];
    for (let i = 0; i < progress.totalChunks; i++) {
      if (!progress.completedChunks.has(i)) missing.push(i);
    }
    return missing;
  }

  pauseTransfer(fileId: string): void {
    const progress = this.transfers.get(fileId);
    if (progress && progress.status === 'transferring') {
      progress.status = 'paused';
    }
  }

  resumeTransfer(fileId: string): void {
    const progress = this.transfers.get(fileId);
    if (progress && progress.status === 'paused') {
      progress.status = 'transferring';
    }
  }

  cancelTransfer(fileId: string): void {
    const progress = this.transfers.get(fileId);
    if (progress) {
      progress.status = 'cancelled';
      this.emit('error', { fileId, reason: 'cancelled' });
    }
    this.cleanup(fileId);
  }

  getProgress(fileId: string): TransferProgress | null {
    return this.transfers.get(fileId) || null;
  }

  getAllTransfers(): TransferProgress[] {
    return Array.from(this.transfers.values());
  }

  async moveCompletedFile(fileId: string, targetPath: string): Promise<void> {
    const stagingPath = this.receiveStaging.get(fileId);
    if (!stagingPath) throw new Error(`No staging file for ${fileId}`);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.rename(stagingPath, targetPath);
    this.receiveStaging.delete(fileId);
  }

  cleanup(fileId: string): void {
    const stagingPath = this.receiveStaging.get(fileId);
    if (stagingPath) {
      fs.unlink(stagingPath).catch(() => undefined);
      this.receiveStaging.delete(fileId);
    }
    this.transfers.delete(fileId);
  }
}
