import cv from '@techstark/opencv-js';

/**
 * OpenCV.js Utility Wrapper for OMR Processing
 * Provides helper functions for image processing operations
 */

let cvReady = false;

/**
 * Initialize OpenCV.js
 * Must be called before using any CV functions
 */
export async function initializeOpenCV(): Promise<void> {
    if (cvReady) return;

    return new Promise((resolve) => {
        if (typeof cv.getBuildInformation === 'function') {
            cvReady = true;
            resolve();
        } else {
            cv.onRuntimeInitialized = () => {
                cvReady = true;
                resolve();
            };
        }
    });
}

/**
 * Check if OpenCV is ready
 */
export function isOpenCVReady(): boolean {
    return cvReady;
}

/**
 * Convert image buffer to OpenCV Mat
 */
export async function bufferToMat(buffer: Buffer): Promise<any> {
    await initializeOpenCV();

    // Decode image using sharp first
    const sharp = require('sharp');
    const { data, info } = await sharp(buffer)
        .removeAlpha() // Ensure 3 channels (RGB)
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Create Mat from raw pixel data
    const mat = cv.matFromArray(info.height, info.width, cv.CV_8UC3, Array.from(data));
    return mat;

}

/**
 * Convert Mat to Buffer
 */
export function matToBuffer(mat: any): Buffer {
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, mat);
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    return Buffer.from(base64, 'base64');
}

/**
 * Convert image to grayscale
 */
export function toGrayscale(src: any): any {
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    return gray;
}

/**
 * Apply Gaussian blur to reduce noise
 */
export function applyGaussianBlur(src: any, kernelSize: number = 5): any {
    const blurred = new cv.Mat();
    cv.GaussianBlur(src, blurred, new cv.Size(kernelSize, kernelSize), 0);
    return blurred;
}

/**
 * Apply adaptive threshold for better bubble detection
 */
export function applyAdaptiveThreshold(src: any): any {
    const thresh = new cv.Mat();
    cv.adaptiveThreshold(
        src,
        thresh,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY_INV,
        11,
        2
    );
    return thresh;
}

/**
 * Detect edges using Canny edge detection
 */
export function detectEdges(src: any, threshold1: number = 50, threshold2: number = 150): any {
    const edges = new cv.Mat();
    cv.Canny(src, edges, threshold1, threshold2);
    return edges;
}

/**
 * Find contours in the image
 */
export function findContours(src: any): { contours: any; hierarchy: any } {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
        src,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
    );
    return { contours, hierarchy };
}

/**
 * Get the largest contour (usually the OMR sheet boundary)
 */
export function getLargestContour(contours: any): any {
    let maxArea = 0;
    let maxContourIndex = -1;

    for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area > maxArea) {
            maxArea = area;
            maxContourIndex = i;
        }
    }

    return maxContourIndex >= 0 ? contours.get(maxContourIndex) : null;
}

/**
 * Apply perspective transform to correct skewed images
 */
export function correctPerspective(src: any, corners: any[]): any {
    // Sort corners: top-left, top-right, bottom-right, bottom-left
    const sortedCorners = sortCorners(corners);

    const width = 2480; // A4 width at 300 DPI
    const height = 3508; // A4 height at 300 DPI

    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        sortedCorners[0].x, sortedCorners[0].y,
        sortedCorners[1].x, sortedCorners[1].y,
        sortedCorners[2].x, sortedCorners[2].y,
        sortedCorners[3].x, sortedCorners[3].y
    ]);

    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        width, 0,
        width, height,
        0, height
    ]);

    const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
    const corrected = new cv.Mat();
    cv.warpPerspective(src, corrected, M, new cv.Size(width, height));

    // Clean up
    srcPoints.delete();
    dstPoints.delete();
    M.delete();

    return corrected;
}

/**
 * Sort corners in clockwise order starting from top-left
 */
function sortCorners(corners: any[]): any[] {
    // Calculate center point
    const centerX = corners.reduce((sum, p) => sum + p.x, 0) / corners.length;
    const centerY = corners.reduce((sum, p) => sum + p.y, 0) / corners.length;

    // Sort by angle from center
    const sorted = corners.sort((a, b) => {
        const angleA = Math.atan2(a.y - centerY, a.x - centerX);
        const angleB = Math.atan2(b.y - centerY, b.x - centerX);
        return angleA - angleB;
    });

    // Find top-left (minimum x+y)
    let minSum = Infinity;
    let topLeftIndex = 0;

    sorted.forEach((point, index) => {
        const sum = point.x + point.y;
        if (sum < minSum) {
            minSum = sum;
            topLeftIndex = index;
        }
    });

    // Rotate array to start from top-left
    return [...sorted.slice(topLeftIndex), ...sorted.slice(0, topLeftIndex)];
}

/**
 * Extract region of interest (ROI) from image
 */
export function extractROI(src: any, x: number, y: number, width: number, height: number): any {
    const rect = new cv.Rect(x, y, width, height);
    return src.roi(rect);
}

/**
 * Calculate fill ratio of a bubble (percentage of dark pixels)
 */
export function calculateFillRatio(roi: any): number {
    const total = roi.rows * roi.cols;
    const filled = cv.countNonZero(roi);
    return filled / total;
}

/**
 * Detect if a bubble is filled
 */
export function isBubbleFilled(roi: any, threshold: number = 0.6): boolean {
    const fillRatio = calculateFillRatio(roi);
    return fillRatio >= threshold;
}

/**
 * Clean up OpenCV Mat objects
 */
export function cleanupMats(...mats: any[]): void {
    mats.forEach(mat => {
        if (mat && mat.delete) {
            mat.delete();
        }
    });
}

/**
 * Resize image to standard dimensions
 */
export function resizeImage(src: any, width: number, height: number): any {
    const resized = new cv.Mat();
    cv.resize(src, resized, new cv.Size(width, height), 0, 0, cv.INTER_LINEAR);
    return resized;
}

/**
 * Enhance image contrast
 */
export function enhanceContrast(src: any): any {
    const enhanced = new cv.Mat();
    cv.equalizeHist(src, enhanced);
    return enhanced;
}

/**
 * Morphological operations to remove noise
 */
export function morphologicalClean(src: any): any {
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const cleaned = new cv.Mat();

    // Opening: erosion followed by dilation (removes small noise)
    cv.morphologyEx(src, cleaned, cv.MORPH_OPEN, kernel);

    kernel.delete();
    return cleaned;
}
