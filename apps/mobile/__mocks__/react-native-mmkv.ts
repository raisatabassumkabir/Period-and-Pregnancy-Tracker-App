/**
 * In-memory stand-in for the native MMKV store. One map per instance id so a
 * test that opens the same store twice sees the same data, mirroring the
 * native behaviour.
 */
const stores = new Map<string, Map<string, string | number | boolean>>();

interface Configuration {
  id?: string;
  encryptionKey?: string;
}

export class MMKV {
  private readonly data: Map<string, string | number | boolean>;

  constructor(configuration: Configuration = {}) {
    const id = configuration.id ?? 'mmkv.default';
    const existing = stores.get(id);
    if (existing) {
      this.data = existing;
    } else {
      this.data = new Map();
      stores.set(id, this.data);
    }
  }

  set(key: string, value: string | number | boolean): void {
    this.data.set(key, value);
  }

  getString(key: string): string | undefined {
    const value = this.data.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = this.data.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.data.get(key);
    return typeof value === 'boolean' ? value : undefined;
  }

  contains(key: string): boolean {
    return this.data.has(key);
  }

  delete(key: string): void {
    this.data.delete(key);
  }

  getAllKeys(): string[] {
    return [...this.data.keys()];
  }

  clearAll(): void {
    this.data.clear();
  }
}
