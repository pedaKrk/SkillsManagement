import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  initialQuality?: number;
}

export interface ProcessedImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly DEFAULT_OPTIONS: ImageCompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8
  };

  /**
   * Validates if a file is a valid image type
   * @param file The file to validate
   * @returns true if the file is a valid image type
   */
  isValidImageType(file: File): boolean {
    return file.type.match(/image\/(jpeg|jpg|png|gif|webp)/) !== null;
  }

  /**
   * Validates if a file is an image and throws an error if not
   * @param file The file to validate
   * @throws Error if the file is not a valid image type
   */
  validateImageType(file: File): void {
    if (!this.isValidImageType(file)) {
      throw new Error('Nur Bilddateien (JPEG, PNG, GIF, WebP) sind erlaubt.');
    }
  }

  /**
   * Compresses an image file
   * @param file The image file to compress
   * @param options Optional compression options
   * @returns Promise<File> The compressed image file
   */
  async compressImage(file: File, options?: ImageCompressionOptions): Promise<File> {
    const compressionOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('Original image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    const compressedFile = await imageCompression(file, compressionOptions);
    
    console.log('Compressed image size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
    
    return compressedFile;
  }

  /**
   * Creates a data URL from a file for preview purposes
   * @param file The file to create a preview URL from
   * @returns Promise<string> The data URL
   */
  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Fehler beim Lesen der Bilddatei.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Fehler beim Lesen der Bilddatei.'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Processes and compresses an image file
   * This method validates the image type, compresses it, and creates a preview URL
   * @param file The image file to process
   * @param options Optional compression options
   * @returns Promise<ProcessedImageResult> The processed image with preview URL and size information
   * @throws Error if the file is not a valid image type or if processing fails
   */
  async processAndCompress(file: File, options?: ImageCompressionOptions): Promise<ProcessedImageResult> {
    // Validate image type
    this.validateImageType(file);
    
    // Compress the image
    const compressedFile = await this.compressImage(file, options);
    
    // Create preview URL
    const previewUrl = await this.createPreviewUrl(compressedFile);
    
    return {
      file: compressedFile,
      previewUrl: previewUrl,
      originalSize: file.size,
      compressedSize: compressedFile.size
    };
  }
}

