/**
 * Utility to compress video files client-side using native browser APIs (Canvas + MediaRecorder).
 * This avoids heavy libraries while providing a way to reduce file size and quality for uploads.
 */
export const compressVideo = async (file: File): Promise<File | Blob> => {
    // If the file is already small enough (e.g., < 10MB), we might skip compression to save time
    // But since the user specifically asked for > 40MB reduction, we'll implement the logic here.
    // Generally, video compression in the browser is slow, so we only want to do it if necessary or requested.

    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;

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

            // Setup MediaRecorder to capture the canvas stream
            const stream = canvas.captureStream(30); // 30 FPS
            const recordedChunks: BlobPart[] = [];

            // Try to use a common codec
            const mimeType = 'video/webm;codecs=vp8';
            const options = {
                mimeType,
                videoBitsPerSecond: 2500000 // 2.5 Mbps - good balance of quality and size
            };

            try {
                const mediaRecorder = new MediaRecorder(stream, options);

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(recordedChunks, { type: 'video/webm' });
                    resolve(blob);
                    URL.revokeObjectURL(video.src);
                };

                // Process frames
                video.play();
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
            } catch (err) {
                console.error('MediaRecorder error:', err);
                // Fallback: return original file if compression fails
                resolve(file);
            }
        };

        video.onerror = (err) => {
            console.error('Video load error:', err);
            resolve(file);
        };
    });
};
