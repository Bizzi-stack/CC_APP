'use client'

import { useState, useRef } from 'react'
import FilterBar from '@/components/FilterBar'
import { useRouter } from 'next/navigation'

export default function CreateItemPage() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        seller_name: '',
        seller_badge: 'None',
        instagram_url: '',
        category: 'Clothing'
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setError(null)

            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(selectedFile)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!file) {
            setError('Please select an image')
            return
        }

        setUploading(true)
        setError(null)

        try {
            // 1. Upload Image
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData,
            })

            const uploadData = await uploadRes.json()

            if (!uploadRes.ok) {
                throw new Error(uploadData.error || 'Image upload failed')
            }

            const imageUrl = uploadData.url

            // 2. Create Item
            const itemData = {
                name: formData.name,
                price: parseFloat(formData.price),
                seller_name: formData.seller_name,
                seller_badge: formData.seller_badge === 'None' ? null : formData.seller_badge,
                instagram_url: formData.instagram_url,
                category: formData.category,
                image_url: imageUrl
            }

            const createRes = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            })

            const createData = await createRes.json()

            if (!createRes.ok) {
                throw new Error(createData.error || 'Failed to create item')
            }

            // Success
            alert('Item created successfully!')
            router.push('/catalog') // Redirect to catalog feed

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#000000] text-white font-sans">
            {/* Logo Header */}
            <div className="flex justify-center items-center py-4 border-b border-[#333333]">
                <img src="/logo.png" alt="ARTIC" className="h-40 object-contain" />
            </div>

            <FilterBar category="" priceRange="" sort="best-match" search="" />

            <div className="max-w-[1440px] mx-auto px-6 py-6">
                <h1 className="text-2xl font-semibold text-[#FFFFFF] mb-6">Create New Item</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">

                    {/* Left Column: Image Upload */}
                    <div className="border border-[#333333] bg-black p-6">
                        <h2 className="text-[14px] font-bold text-white uppercase tracking-wider mb-4">Item Image</h2>

                        <div className="mb-6">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="image-upload"
                            />
                            <label
                                htmlFor="image-upload"
                                className={`flex flex-col items-center justify-center w-full aspect-square border border-dashed border-[#333333] hover:border-white cursor-pointer transition bg-black ${preview ? 'border-none p-0' : 'p-4'}`}
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <span className="text-[40px] mb-2 block text-[#333333]">+</span>
                                        <span className="text-[13px] text-[#9A9A9A]">Click to upload image</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Right Column: Details Form */}
                    <div className="border border-[#333333] bg-black p-6">
                        <h2 className="text-[14px] font-bold text-white uppercase tracking-wider mb-4">Item Details</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div>
                                <label className="block text-[11px] font-medium text-[#9A9A9A] mb-1">Item Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full h-9 px-3 bg-transparent border border-[#333333] text-white text-[13px] outline-none focus:border-white transition placeholder-[#555]"
                                    placeholder="e.g. Vintage Denim Jacket"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-[#9A9A9A] mb-1">Price (BBD)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full h-9 px-3 bg-transparent border border-[#333333] text-white text-[13px] outline-none focus:border-white transition placeholder-[#555]"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-[#9A9A9A] mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full h-9 px-3 bg-transparent border border-[#333333] text-white text-[13px] outline-none focus:border-white transition cursor-pointer"
                                    >
                                        <option value="Clothing" className="bg-black">Clothing</option>
                                        <option value="Shoes" className="bg-black">Shoes</option>
                                        <option value="Accessories" className="bg-black">Accessories</option>
                                        <option value="Home" className="bg-black">Home</option>
                                        <option value="Art" className="bg-black">Art</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[#9A9A9A] mb-1">Seller Name</label>
                                <input
                                    type="text"
                                    name="seller_name"
                                    value={formData.seller_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full h-9 px-3 bg-transparent border border-[#333333] text-white text-[13px] outline-none focus:border-white transition placeholder-[#555]"
                                    placeholder="Your Name or Brand"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[#9A9A9A] mb-1">Seller Badge</label>
                                <select
                                    name="seller_badge"
                                    value={formData.seller_badge}
                                    onChange={handleInputChange}
                                    className="w-full h-9 px-3 bg-transparent border border-[#333333] text-white text-[13px] outline-none focus:border-white transition cursor-pointer"
                                >
                                    <option value="None" className="bg-black">None</option>
                                    <option value="ID Verified" className="bg-black">ID Verified</option>
                                    <option value="Pro" className="bg-black">Pro</option>
                                    <option value="Verified" className="bg-black">Verified</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[#9A9A9A] mb-1">Instagram URL</label>
                                <input
                                    type="url"
                                    name="instagram_url"
                                    value={formData.instagram_url}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full h-9 px-3 bg-transparent border border-[#333333] text-white text-[13px] outline-none focus:border-white transition placeholder-[#555]"
                                    placeholder="https://instagram.com/..."
                                />
                            </div>

                            {error && (
                                <div className="p-3 border border-red-900 bg-red-900/10 text-red-500 text-[12px]">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full h-10 mt-2 bg-white text-black text-[13px] font-bold uppercase tracking-wider hover:bg-gray-200 transition disabled:opacity-50"
                            >
                                {uploading ? 'Creating Item...' : 'Create Item'}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
