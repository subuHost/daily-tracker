/**
 * Compress an image file and return a base64 string (without data URL prefix).
 * Used by the chat widget for inline image analysis.
 */
export async function compressImage(
    file: File,
    maxWidth: number = 1024,
    quality: number = 0.7
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
                const base64 = compressedDataUrl.split(",")[1];
                resolve(base64);
            };

            img.onerror = () => reject(new Error("Failed to load image"));
        };

        reader.onerror = () => reject(new Error("Failed to read file"));
    });
}

/**
 * Compress an image file and return a new File object.
 * Used for uploading compressed images to Supabase storage.
 */
export async function compressImageToFile(
    file: File,
    maxWidth: number = 1024,
    quality: number = 0.7
): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Failed to compress image"));
                            return;
                        }
                        const compressedFile = new File(
                            [blob],
                            file.name.replace(/\.[^.]+$/, ".jpg"),
                            { type: "image/jpeg" }
                        );
                        resolve(compressedFile);
                    },
                    "image/jpeg",
                    quality
                );
            };

            img.onerror = () => reject(new Error("Failed to load image"));
        };

        reader.onerror = () => reject(new Error("Failed to read file"));
    });
}
