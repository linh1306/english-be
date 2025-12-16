import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface ImageUrls {
    large: string; // width 1280
    medium: string; // width 640
}

@Injectable()
export class CloudinaryService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(buffer: Buffer, folder: string): Promise<ImageUrls> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder: `english-app/${folder}`,
                        format: 'jpg',
                        quality: 'auto:good',
                        eager: [
                            { width: 1280, crop: 'scale', quality: 'auto', format: 'jpg' },
                            { width: 640, crop: 'scale', quality: 'auto', format: 'jpg' },
                        ],
                        eager_async: false,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else
                            resolve({
                                large: result!.eager[0].secure_url,
                                medium: result!.eager[1].secure_url,
                            });
                    },
                )
                .end(buffer);
        });
    }
}
