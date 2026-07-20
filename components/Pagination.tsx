'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', page.toString())
      router.push(`/catalog?${params.toString()}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [router, searchParams]
  )

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5" style={{ height: '48px' }}>
      <div className="text-[12px] text-[#9A9A9A] mr-2">
        Page {currentPage} / {totalPages}
      </div>
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-[#9A9A9A]">
              ...
            </span>
          )
        }
        const pageNum = page as number
        return (
          <button
            key={pageNum}
            onClick={() => goToPage(pageNum)}
            className={`w-7 h-7 rounded-[4px] text-[12px] font-medium transition ${
              currentPage === pageNum
                ? 'bg-[#FFD100] text-[#000000]'
                : 'bg-[#2A2A2A] text-[#FFFFFF] hover:bg-[#3A3A3A]'
            }`}
          >
            {pageNum}
          </button>
        )
      })}
    </div>
  )
}
