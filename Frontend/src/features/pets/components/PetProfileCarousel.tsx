import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { Pet } from '../types'
import { PetAvatar } from './PetAvatar'
import styles from './PetProfileCarousel.module.css'

type PetProfileCarouselProps = {
  pets: Pet[]
  selectedPet: Pet | null
  statusMessage?: string
  onSelect: (petId: number) => void
}

type DragState = {
  pointerId: number
  startX: number
  scrollLeft: number
}

export function PetProfileCarousel({
  pets,
  selectedPet,
  statusMessage,
  onSelect,
}: PetProfileCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)
  const hasOverflow = pets.length > 5

  const scrollProfiles = (direction: -1 | 1) => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scrollBy({
      left: direction * Math.max(viewport.clientWidth * 0.9, 280),
      behavior: 'smooth',
    })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
    }
    suppressClickRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return

    const distance = event.clientX - dragState.startX
    if (Math.abs(distance) > 5) {
      suppressClickRef.current = true
      event.currentTarget.scrollLeft = dragState.scrollLeft - distance
    }
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragStateRef.current = null
    window.setTimeout(() => { suppressClickRef.current = false }, 0)
  }

  return (
    <section className={styles.picker} aria-label="정보를 입력할 반려동물 선택">
      <div className={styles.heading}><strong>반려동물 선택</strong></div>
      <div className={styles.carousel}>
        {hasOverflow && (
          <button type="button" className={styles.arrow} aria-label="이전 반려동물 보기" onClick={() => scrollProfiles(-1)}>
            ‹
          </button>
        )}
        <div
          ref={viewportRef}
          className={styles.viewport}
          onDragStart={(event) => event.preventDefault()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <div className={styles.track}>
            {pets.map((pet) => {
              const isSelected = pet.id === selectedPet?.id

              return (
                <button
                  type="button"
                  className={`${styles.petButton} ${isSelected ? styles.selected : ''}`}
                  key={pet.id}
                  aria-pressed={isSelected}
                  aria-label={`${pet.name} 선택`}
                  onClick={() => {
                    if (!suppressClickRef.current) onSelect(pet.id)
                  }}
                >
                  <span className={styles.avatarRing}><PetAvatar pet={pet} size="medium" /></span>
                  <small>{pet.name}</small>
                </button>
              )
            })}
          </div>
        </div>
        {hasOverflow && (
          <button type="button" className={styles.arrow} aria-label="다음 반려동물 보기" onClick={() => scrollProfiles(1)}>
            ›
          </button>
        )}
      </div>
      {statusMessage && <p className={styles.status} aria-live="polite">{statusMessage}</p>}
    </section>
  )
}
