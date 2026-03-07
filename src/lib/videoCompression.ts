/**
 * Utility to compress video files client-side using native browser APIs (Canvas + MediaRecorder).
 * This avoids heavy libraries while providing a way to reduce file size and quality for uploads.
 */
export const compressVideo = async (file: File): Promise<File | Blob> => {
    // If it's not a video, just return it
    if (!file.type.startsWith('video/')) {
        return file;
    }

    return new Promise((resolve) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const objectUrl = URL.createObjectURL(file);

        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.src = objectUrl;

        const cleanup = () => {
            URL.revokeObjectURL(objectUrl);
            video.remove();
            canvas.remove();
        };

        const handleFailure = (msg: string, err?: any) => {
            console.warn(`Compression fallback: ${msg}`, err);
            cleanup();
            resolve(file);
        };

        video.onerror = () => {
            const error = video.error;
            let errorMessage = 'Unknown video error';
            if (error) {
                switch (error.code) {
                    case error.MEDIA_ERR_ABORTED: errorMessage = 'Loading aborted'; break;
                    case error.MEDIA_ERR_NETWORK: errorMessage = 'Network error'; break;
                    case error.MEDIA_ERR_DECODE: errorMessage = 'Decoding error'; break;
                    case error.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMessage = 'Format not supported or file inaccessible'; break;
                }
            }
            handleFailure(`Video failed to load: ${errorMessage} (code: ${error?.code})`);
        };

        video.onloadedmetadata = () => {
            // Aim for a standard resolution (max 720p height)
            const targetHeight = 720;
            const scale = targetHeight / video.videoHeight;

            if (scale < 1) {
                canvas.width = video.videoWidth * scale;
                canvas.height = targetHeight;
            } else {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            // Find supported mime type
            const mimeTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm',
                'video/mp4'
            ];
            const supportedMimeType = mimeTypes.find(type => {
                try {
                    return MediaRecorder.isTypeSupported(type);
                } catch (e) {
                    return false;
                }
            });

            if (!supportedMimeType) {
                return handleFailure('No supported MediaRecorder mime types found');
            }

            // Setup MediaRecorder to capture the canvas stream
            // @ts-ignore - captureStream is sometimes missing in TS but exists in modern browsers
            const stream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream ? (canvas as any).mozCaptureStream(30) : null;

            if (!stream) {
                return handleFailure('Canvas captureStream not supported');
            }

            const recordedChunks: BlobPart[] = [];

            try {
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: supportedMimeType,
                    videoBitsPerSecond: 2500000 // 2.5 Mbps
                });

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(recordedChunks, { type: supportedMimeType });
                    cleanup();
                    resolve(blob);
                };

                video.oncanplay = () => {
                    video.play().then(() => {
                        mediaRecorder.start();

                        const drawFrame = () => {
                            if (video.paused || video.ended) {
                                mediaRecorder.stop();
                                return;
                            }
                            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                            requestAnimationFrame(drawFrame);
                        };

                        drawFrame();
                    }).catch(err => handleFailure('Video playback failed', err));
                };
            } catch (err) {
                handleFailure('MediaRecorder initialization failed', err);
            }
        };

        video.load(); // Explicitly trigger load
    });
};
