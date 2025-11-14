import sharp from 'sharp';

/**
 * Embed a unique fingerprint (userId_variantId_timestamp) into image
 * Uses LSB (Least Significant Bit) steganography
 * @returns Uint8Array with invisible watermark
 */
export async function embedWatermark(
  imageBuffer: Uint8Array,
  payload: string
): Promise<Uint8Array> {
  console.log('Embedding watermark with payload:', payload);
  
  const image = sharp(imageBuffer);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // Convert payload to binary string
  let binary = '';
  for (let i = 0; i < payload.length; i++) {
    binary += payload.charCodeAt(i).toString(2).padStart(8, '0');
  }
  
  // Add length prefix and delimiter for extraction
  const lengthBits = payload.length.toString(2).padStart(16, '0');
  binary = lengthBits + binary + '0000000011111111'; // Delimiter

  if (binary.length > data.length) {
    throw new Error('Payload too large for image');
  }

  // Embed in LSB of each byte (R channel only)
  let bitIndex = 0;
  for (let i = 0; i < data.length && bitIndex < binary.length; i += 4) {
    if (bitIndex < binary.length) {
      const bit = binary[bitIndex];
      data[i] = (data[i] & 0xFE) | parseInt(bit); // Clear LSB, set new
      bitIndex++;
    }
  }

  console.log('Watermark embedded successfully');

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels }
  })
    .png()
    .toBuffer();
}

/**
 * Extract fingerprint from image
 * @returns Original payload or null if not found
 */
export async function extractWatermark(imageBuffer: Uint8Array): Promise<string | null> {
  try {
    console.log('Extracting watermark...');
    
    const image = sharp(imageBuffer);
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });

    let binary = '';
    for (let i = 0; i < data.length; i += 4) {
      binary += (data[i] & 1).toString();
      if (binary.length > 32 && binary.endsWith('0000000011111111')) {
        binary = binary.slice(0, -16); // Remove delimiter
        break;
      }
    }

    if (binary.length < 16) {
      console.log('No watermark found');
      return null;
    }

    const length = parseInt(binary.slice(0, 16), 2);
    const payloadBits = binary.slice(16, 16 + length * 8);
    
    if (payloadBits.length !== length * 8) {
      console.log('Invalid watermark length');
      return null;
    }

    let payload = '';
    for (let i = 0; i < payloadBits.length; i += 8) {
      payload += String.fromCharCode(parseInt(payloadBits.slice(i, i + 8), 2));
    }

    console.log('Watermark extracted:', payload);
    return payload;
  } catch (error) {
    console.error('Error extracting watermark:', error);
    return null;
  }
}
