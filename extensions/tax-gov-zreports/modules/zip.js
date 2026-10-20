// ==============================================================================
// KaderGo - In-memory ZIP Generator (Pure JS, no external libraries)
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const textEncoder = new TextEncoder();

  class SimpleZip {
    constructor() {
      this.files = [];
    }

    addFile(name, content) {
      const data = typeof content === 'string' ? textEncoder.encode(content) : content;
      const nameBuf = textEncoder.encode(name);
      const crc = crc32(data);
      this.files.push({
        name,
        nameBuf,
        data,
        crc,
        size: data.length
      });
    }

    toUint8Array() {
      let totalSize = 22; // EOCD size
      for (const f of this.files) {
        totalSize += 30 + f.nameBuf.length + f.size; // Local header + data
        totalSize += 46 + f.nameBuf.length;          // Central header
      }

      const out = new Uint8Array(totalSize);
      const view = new DataView(out.buffer);

      let offset = 0;
      const centralOffsets = [];

      // Local headers + data
      for (const f of this.files) {
        centralOffsets.push(offset);

        view.setUint32(offset, 0x04034b50, true);
        view.setUint16(offset + 4, 20, true);
        view.setUint16(offset + 6, 0x0800, true); // UTF-8
        view.setUint16(offset + 8, 0, true);      // stored
        view.setUint16(offset + 10, 0x4000, true);
        view.setUint16(offset + 12, 0x5600, true);
        view.setUint32(offset + 14, f.crc, true);
        view.setUint32(offset + 18, f.size, true);
        view.setUint32(offset + 22, f.size, true);
        view.setUint16(offset + 26, f.nameBuf.length, true);
        view.setUint16(offset + 28, 0, true);

        out.set(f.nameBuf, offset + 30);
        out.set(f.data, offset + 30 + f.nameBuf.length);

        offset += 30 + f.nameBuf.length + f.size;
      }

      const centralDirOffset = offset;

      // Central directory headers
      for (let i = 0; i < this.files.length; i++) {
        const f = this.files[i];
        const localOffset = centralOffsets[i];

        view.setUint32(offset, 0x02014b50, true);
        view.setUint16(offset + 4, 20, true);
        view.setUint16(offset + 6, 20, true);
        view.setUint16(offset + 8, 0x0800, true);
        view.setUint16(offset + 10, 0, true);
        view.setUint16(offset + 12, 0x4000, true);
        view.setUint16(offset + 14, 0x5600, true);
        view.setUint32(offset + 16, f.crc, true);
        view.setUint32(offset + 20, f.size, true);
        view.setUint32(offset + 24, f.size, true);
        view.setUint16(offset + 28, f.nameBuf.length, true);
        view.setUint16(offset + 30, 0, true);
        view.setUint16(offset + 32, 0, true);
        view.setUint16(offset + 34, 0, true);
        view.setUint16(offset + 36, 0, true);
        view.setUint32(offset + 38, 0, true);
        view.setUint32(offset + 42, localOffset, true);

        out.set(f.nameBuf, offset + 46);
        offset += 46 + f.nameBuf.length;
      }

      const centralDirSize = offset - centralDirOffset;

      // End of central directory record
      view.setUint32(offset, 0x06054b50, true);
      view.setUint16(offset + 4, 0, true);
      view.setUint16(offset + 6, 0, true);
      view.setUint16(offset + 8, this.files.length, true);
      view.setUint16(offset + 10, this.files.length, true);
      view.setUint32(offset + 12, centralDirSize, true);
      view.setUint32(offset + 16, centralDirOffset, true);
      view.setUint16(offset + 20, 0, true);

      return out;
    }
  }

  window.KaderGo.Zip = {
    SimpleZip,
    crc32
  };
})();
