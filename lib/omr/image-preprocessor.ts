import sharp from 'sharp';

/**
 * Image Preprocessing Utilities using Sharp
 * Prepares images for OpenCV processing
 */

export interface PreprocessingOptions {
    targetWidth?: number;
    targetHeight?: number;
    enhanceContrast?: boolean;
    removeNoise?: boolean;
    sharpen?: boolean;
}

/**
 * Preprocess image for OMR detection
 * Converts to grayscale, enhances contrast, removes noise
 */
export async function preprocessImage(
    imageBuffer: Buffer,
    options: PreprocessingOptions = {}
): Promise<Buffer> {
    const {
        targetWidth = 2480,
        targetHeight = 3508,
        enhanceContrast = true,
        removeNoise = true,
        sharpen = true
    } = options;

    let pipeline = sharp(imageBuffer);

    // Convert to grayscale
    pipeline = pipeline.grayscale();

    // Enhance contrast
    if (enhanceContrast) {
        pipeline = pipeline.normalize();
    }

    // Remove noise with median filter
    if (removeNoise) {
        pipeline = pipeline.median(3);
    }

    // Sharpen image
    if (sharpen) {
        pipeline = pipeline.sharpen();
    }

    // Resize to standard A4 dimensions (300 DPI)
    pipeline = pipeline.resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 }
    });

    // Convert to PNG for OpenCV compatibility
    const processed = await pipeline.png().toBuffer();

    return processed;
}

/**
 * Validate uploaded image
 */
export interface ImageValidationResult {
    valid: boolean;
    error?: string;
    metadata?: {
        width: number;
        height: number;
        format: string;
        size: number;
    };
}

export async function validateImage(buffer: Buffer): Promise<ImageValidationResult> {
    try {
        const metadata = await sharp(buffer).metadata();

        // Check minimum dimensions
        if (!metadata.width || !metadata.height) {
            return {
                valid: false,
                error: 'Unable to read image dimensions'
            };
        }

        if (metadata.width < 800 || metadata.height < 1000) {
            return {
                valid: false,
                error: `Image too small. Minimum 800x1000 pixels. Got ${metadata.width}x${metadata.height}`
            };
        }

        // Check format
        const allowedFormats = ['jpeg', 'jpg', 'png'];
        if (!metadata.format || !allowedFormats.includes(metadata.format)) {
            return {
                valid: false,
                error: `Invalid format. Only JPEG/PNG allowed. Got ${metadata.format}`
            };
        }

        // CHECKPOINT 1: Validate image has sufficient contrast (not blank/white paper)
        const stats = await sharp(buffer)
            .grayscale()
            .stats();

        const channelStats = stats.channels[0]; // Grayscale has 1 channel
        const mean = channelStats.mean;
        const stdDev = channelStats.stdev;

        // Blank white paper will have very high mean (~240-255) and very low stdDev (~0-5)
        if (mean > 240 && stdDev < 10) {
            return {
                valid: false,
                error: 'Image appears to be blank or has insufficient content. Please upload a filled OMR sheet.'
            };
        }

        // Completely black images (also invalid)
        if (mean < 15 && stdDev < 10) {
            return {
                valid: false,
                error: 'Image is too dark or corrupted. Please upload a clear OMR sheet.'
            };
        }

        // Low contrast check (likely empty or very faint)
        if (stdDev < 15) {
            return {
                valid: false,
                error: 'Image has very low contrast. Please ensure the OMR sheet has clear markings.'
            };
        }

        return {
            valid: true,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: buffer.length
            }
        };
    } catch (error) {
        return {
            valid: false,
            error: `Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Compress image for storage
 */
export async function compressImage(
    buffer: Buffer,
    quality: number = 85
): Promise<Buffer> {
    return await sharp(buffer)
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
}

/**
 * Auto-rotate image based on EXIF orientation
 */
export async function autoRotateImage(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF
        .toBuffer();
}

/**
 * Convert image to base64 for AI processing
 */
export async function imageToBase64(buffer: Buffer): Promise<string> {
    const processed = await sharp(buffer)
        .jpeg({ quality: 90 })
        .toBuffer();

    return processed.toString('base64');
}

/**
 * Create thumbnail for preview
 */
export async function createThumbnail(
    buffer: Buffer,
    width: number = 300,
    height: number = 400
): Promise<Buffer> {
    return await sharp(buffer)
        .resize(width, height, {
            fit: 'cover',
            position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
}
