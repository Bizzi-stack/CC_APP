import { useState, useRef, useEffect } from 'react'

export type DialogOptions = {
  type: 'alert' | 'confirm' | 'prompt'
  message: string
  title?: string
  defaultValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
}

type DialogState = DialogOptions & {
  isOpen: boolean
  onConfirm: (value?: string) => void
  onCancel: () => void
}

export function useCustomDialog() {
  const [dialogState, setDialogState] = useState<DialogState | null>(null)

  const showDialog = (options: DialogOptions): Promise<string | boolean | null> => {
    return new Promise((resolve) => {
      setDialogState({
        ...options,
        isOpen: true,
        onConfirm: (val) => {
          setDialogState(prev => prev ? { ...prev, isOpen: false } : null)
          setTimeout(() => setDialogState(null), 300) // Allow animation to finish
          resolve(options.type === 'prompt' ? (val || '') : true)
        },
        onCancel: () => {
          setDialogState(prev => prev ? { ...prev, isOpen: false } : null)
          setTimeout(() => setDialogState(null), 300)
          resolve(options.type === 'prompt' ? null : false)
        }
      })
    })
  }

  const DialogComponent = () => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [inputValue, setInputValue] = useState('')

    // Reset input value when dialog opens
    useEffect(() => {
      if (dialogState?.isOpen && dialogState.type === 'prompt') {
        setInputValue(dialogState.defaultValue || '')
        // Focus input after a short delay to ensure modal is rendered
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }
    }, [dialogState?.isOpen, dialogState?.type, dialogState?.defaultValue])

    if (!dialogState) return null

    const handleConfirm = () => {
      if (dialogState.type === 'prompt') {
        dialogState.onConfirm(inputValue)
      } else {
        dialogState.onConfirm()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleConfirm()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        dialogState.onCancel()
      }
    }

    return (
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${dialogState.isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => {
          // Close on backdrop click if it's an alert or confirm. For prompt, maybe require explicit cancel.
          if (e.target === e.currentTarget && dialogState.type !== 'prompt') {
            dialogState.onCancel()
          }
        }}
      >
        <div 
          className={`bg-[#0a0a0a] border border-[#333] shadow-2xl w-full max-w-sm overflow-hidden transition-all duration-300 transform ${dialogState.isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
          onKeyDown={handleKeyDown}
        >
          <div className="p-6 space-y-4">
            <h3 className="text-white font-bold tracking-widest uppercase text-sm border-b border-[#222] pb-2">
              {dialogState.title || (dialogState.type === 'alert' ? 'Notification' : dialogState.type === 'confirm' ? 'Confirmation' : 'Input Required')}
            </h3>
            
            <p className="text-[#aaa] text-xs leading-relaxed">
              {dialogState.message.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </p>

            {dialogState.type === 'prompt' && (
              <div className="pt-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={dialogState.placeholder}
                  className="w-full bg-[#111] border border-[#333] p-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex border-t border-[#222] bg-[#050505]">
            {dialogState.type !== 'alert' && (
              <button
                onClick={dialogState.onCancel}
                className="flex-1 py-3 text-xs font-bold text-[#888] uppercase tracking-widest hover:text-white hover:bg-[#111] transition-colors active:bg-[#222]"
              >
                {dialogState.cancelText || 'Cancel'}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors active:opacity-80
                ${dialogState.type === 'alert' 
                  ? 'text-white hover:bg-[#111]' 
                  : 'text-black bg-white hover:bg-gray-200'
                }
              `}
            >
              {dialogState.confirmText || 'OK'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return { showDialog, DialogComponent }
}
