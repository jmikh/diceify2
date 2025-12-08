'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { useEditorStore } from '@/lib/store/useEditorStore'
import { theme } from '@/lib/theme'

interface ImageUploaderProps {
    onUpload?: (url: string) => void
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
    const uploadImage = useEditorStore(state => state.uploadImage)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result
                if (typeof result === 'string') {
                    // Create an image object to verify/get dimensions if needed
                    const img = new Image()
                    img.src = result
                    img.onload = () => {
                        if (onUpload) {
                            onUpload(result)
                        } else {
                            uploadImage(result)
                        }
                    }
                }
            }
            reader.readAsDataURL(file)
        }
    }, [uploadImage, onUpload])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1
    })

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                {...getRootProps()}
                className={`
          flex flex-col items-center justify-center p-12 lg:p-16 text-center
          rounded-3xl border-2 border-dashed cursor-pointer
          transition-all duration-300 group
          ${isDragActive
                        ? 'border-pink-500 bg-pink-500/10 scale-[1.02]'
                        : 'border-white/10 hover:border-pink-500/50 hover:bg-white/5'
                    }
        `}
            >
                <input {...getInputProps()} />

                <div className={`
          w-20 h-20 mb-6 rounded-2xl flex items-center justify-center
          transition-all duration-500
          ${isDragActive ? 'bg-pink-500 text-white rotate-12 scale-110' : 'bg-white/5 text-pink-500 group-hover:scale-110 group-hover:rotate-6'}
        `}>
                    {isDragActive ? (
                        <Upload size={40} className="animate-bounce" />
                    ) : (
                        <ImageIcon size={40} />
                    )}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                    {isDragActive ? 'Drop it like it\'s hot!' : 'Upload your photo'}
                </h3>

                <p className="text-gray-400 text-lg mb-8 max-w-xs">
                    Drag and drop your image here, or click to browse files
                </p>

                <div className={`
          px-6 py-3 rounded-xl font-semibold text-sm transition-all
          ${isDragActive
                        ? 'bg-white text-pink-600 shadow-lg'
                        : 'bg-white/10 text-white group-hover:bg-pink-600 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                    }
        `}>
                    Select File
                </div>
            </div>
        </div>
    )
}
