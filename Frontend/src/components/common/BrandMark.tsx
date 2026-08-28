import styles from './BrandMark.module.css'
import { PawIcon } from './PawIcon'

type BrandMarkProps = {
  inverse?: boolean
}

export function BrandMark({ inverse = false }: BrandMarkProps) {
  return (
    <span className={`${styles.brand} ${inverse ? styles.inverse : ''}`}>
      <span className={styles.symbol} aria-hidden="true">
        <PawIcon />
      </span>
      <span className={styles.name}>PatPet</span>
    </span>
  )
}
