/**
 * 简化版 electron-store 内存 mock。
 * 支持点号路径 get/set/delete（与真实 API 一致），不写盘。
 */

type StoreOptions<T> = {
  name?: string;
  encryptionKey?: string;
  defaults?: T;
};

function getDeep(obj: any, pathStr: string): any {
  return pathStr.split('.').reduce((o, key) => (o == null ? undefined : o[key]), obj);
}

function setDeep(obj: any, pathStr: string, value: any): void {
  const parts = pathStr.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function deleteDeep(obj: any, pathStr: string): void {
  const parts = pathStr.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur?.[parts[i]];
    if (cur == null) return;
  }
  delete cur[parts[parts.length - 1]];
}

export default class Store<T extends Record<string, any> = Record<string, any>> {
  private data: any;

  constructor(opts: StoreOptions<T> = {}) {
    this.data = { ...(opts.defaults || {}) };
  }

  get(key: string, fallback?: any): any {
    const value = getDeep(this.data, key);
    return value === undefined ? fallback : value;
  }

  set(keyOrObj: any, value?: any): void {
    if (typeof keyOrObj === 'string') {
      setDeep(this.data, keyOrObj, value);
    } else if (keyOrObj && typeof keyOrObj === 'object') {
      for (const k of Object.keys(keyOrObj)) {
        setDeep(this.data, k, keyOrObj[k]);
      }
    }
  }

  delete(key: string): void {
    deleteDeep(this.data, key);
  }

  has(key: string): boolean {
    return getDeep(this.data, key) !== undefined;
  }

  clear(): void {
    this.data = {};
  }

  get store(): any {
    return this.data;
  }
}
