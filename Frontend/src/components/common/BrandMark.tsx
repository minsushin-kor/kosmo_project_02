import styles from './BrandMark.module.css'

type BrandMarkProps = {
  inverse?: boolean
}

export function BrandMark({ inverse = false }: BrandMarkProps) {
  return (
    <span className={`${styles.brand} ${inverse ? styles.inverse : ''}`}>
      <span className={styles.symbol} aria-hidden="true">
        <svg viewBox="0 0 40 40">
          <circle cx="11" cy="13" r="4" />
          <circle cx="20" cy="9" r="4" />
          <circle cx="29" cy="13" r="4" />
          <path d="M20 16c-7 0-12 5.1-12 10.4 0 4.1 3.1 6.6 7 5.1 1.9-.7 3.2-1.2 5-1.2s3.1.5 5 1.2c3.9 1.5 7-1 7-5.1C32 21.1 27 16 20 16Z" />
        </svg>
      </span>
      <span className={styles.name}>PetPulse</span>
    </span>
  )
}
