export interface Checkpoint {
  origin: string;
  entries: number;
  root_hash: string;
  signature: string;
  text: string;
}

export function buf2hex(buf: Uint8Array) {
  // buffer is an ArrayBuffer
  return [...buf]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

const HEIGHT = 8;
const PATH_BASE = 1000;

export async function getCheckpoint(logUrl: string): Promise<Checkpoint> {
  const resp = await fetch(logUrl + "checkpoint");
  const text = await resp.text();
  const lines = text.split("\n");

  return {
    origin: lines[0],
    entries: parseInt(lines[1], 10),
    root_hash: lines[2],
    signature: lines[3].slice(2), // Removes the leading "— "
    text,
  };
}

export async function getIndex(
  logUrl: string,
  index: number
): Promise<LogEntry> {
  const total = (await getCheckpoint(logUrl)).entries;
  let leaf = index >>> HEIGHT;
  let relIdx = index - (leaf << HEIGHT);
  console.log('Looking for index', index, 'tile', leaf, 'offset', relIdx);
  const resp = await fetch(logUrl + pathForLeaf(leaf, total));
  const tile = new Uint8Array(await resp.arrayBuffer());
  const reader = new ByteReader(tile);
  for (let i = 0; i < relIdx; ++i) {
    let length = reader.readUint16();
    console.log('Skipping entry', i, 'length', length);
    reader.skip(length);
  }
  const e = new LogEntry();
  let length = reader.readUint16();
  let lastModified = resp.headers.get('last-modified');
  console.log('Last modified', lastModified);
  if (lastModified != null)
    e.Timestamp = Date.parse(lastModified);
  const raw = reader.read(length);
  e.Data = new TextDecoder().decode(raw);
  e.Hash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", raw)
  );
  return e;
}

// ---------------------------------------------------------

function leafForIndex(index: number): number {
  return Math.floor(index / (1 << HEIGHT));
}

function pathForLeaf(i: number, total: number): string {
  let n = i;
  let nStr = String(n % PATH_BASE).padStart(3, "0");

  while (n >= PATH_BASE) {
    n = Math.floor(n / PATH_BASE);
    nStr = `x${String(n % PATH_BASE).padStart(3, "0")}/${nStr}`;
  }

  let pStr = "";
  if (leafForIndex(total) === i) {
    const finalWidth = total % (1 << HEIGHT);
    pStr = `.p/${finalWidth}`;
  }

  return `tile/entries/${nStr}${pStr}`;
}

// ---------------------------------------------------------

export class LogEntry {
  Timestamp: number = 0;
  Data: string = '';
  Hash: Uint8Array = new Uint8Array(32);
}

class ByteReader {
  private view;
  private offset;

  constructor(buffer: Uint8Array) {
    this.view = new DataView(buffer.buffer);
    this.offset = 0;
  }

  readUint64(): number {
    const value = this.view.getBigUint64(this.offset, false);
    this.offset += 8;
    return Number(value);
  }

  readUint16(): number {
    const value = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return value;
  }

  readUint8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readUint40(): number {
    const value =
      this.view.getUint8(this.offset) * 2 ** 32 +
      this.view.getUint32(this.offset + 1, false);
    this.offset += 5;
    return value;
  }

  readUint24LengthPrefixed(): Uint8Array {
    const length =
      (this.view.getUint8(this.offset) << 16) |
      (this.view.getUint8(this.offset + 1) << 8) |
      this.view.getUint8(this.offset + 2);
    const value = new Uint8Array(this.view.buffer, this.offset + 3, length);
    this.offset += 3 + length;
    return value;
  }

  readUint16LengthPrefixed(): Uint8Array {
    const length = this.view.getUint16(this.offset, false);
    const value = new Uint8Array(this.view.buffer, this.offset + 2, length);
    this.offset += 2 + length;
    return value;
  }

  skip(x: number) {
    this.offset += x;
  }

  read(x: number): Uint8Array {
    const value = new Uint8Array(this.view.buffer, this.offset, x);
    this.offset += x;
    return value;
  }

  length(): number {
    return this.view.byteLength - this.offset;
  }
}
