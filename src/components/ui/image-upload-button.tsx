"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { compressImageToFile } from "@/lib/utils/compress-image";
import { uploadGalleryFile } from "@/lib/db/gallery";
import Image from "next/image";

interface ImageUploadButtonProps {
    onUploadComplete: (url: string) => void;
    onError?: (error: Error) => void;
    accept?: string;
    compress?: boolean;
    maxWidth?: number;
    quality?: number;
    description?: string;
    tags?: string[];
    variant?: "button" | "icon";
    className?: string;
    disabled?: boolean;
    label?: string;
}

export function ImageUploadButton({
    onUploadComplete,
    onError,
    accept = "image/*",
    compress = true,
    maxWidth = 1024,
    quality = 0.7,
    description,
    tags,
    variant = "button",
    className,
    disabled = false,
    label = "Upload Image",
}: ImageUploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so same file can be re-selected
        if (inputRef.current) inputRef.current.value = "";

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        // 10MB limit
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be under 10MB");
            return;
        }

        setIsUploading(true);
        try {
            const fileToUpload = compress
                ? await compressImageToFile(file, maxWidth, quality)
                : file;

            const galleryItem = await uploadGalleryFile(
                fileToUpload,
                description,
                tags
            );

            onUploadComplete(galleryItem.file_url);
            toast.success("Image uploaded");
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Upload failed");
            if (onError) {
                onError(error);
            } else {
                toast.error(error.message);
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isUploading}
            />
            {variant === "icon" ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className={className}
                >
                    {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ImagePlus className="h-4 w-4" />
                    )}
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className={className}
                >
                    {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <ImagePlus className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? "Uploading..." : label}
                </Button>
            )}
        </>
    );
}

/** Thumbnail grid for displaying uploaded images with remove buttons */
export function ImageThumbnails({
    images,
    onRemove,
    className,
}: {
    images: string[];
    onRemove?: (url: string) => void;
    className?: string;
}) {
    if (!images.length) return null;

    return (
        <div className={`flex flex-wrap gap-2 ${className || ""}`}>
            {images.map((url, i) => (
                <div key={i} className="relative group w-16 h-16 rounded-md overflow-hidden border">
                    <Image
                        src={url}
                        alt={`Upload ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                    {onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(url)}
                            className="absolute top-0 right-0 bg-black/60 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
