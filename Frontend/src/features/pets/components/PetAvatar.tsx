import { getPetEmoji, type Pet } from '../types'
import styles from './PetAvatar.module.css'

type PetAvatarProps = {
  pet: Pet
  size?: 'small' | 'medium' | 'large'
}

export function PetAvatar({ pet, size = 'medium' }: PetAvatarProps) {
  return (
    <span className={`${styles.avatar} ${styles[pet.accent]} ${styles[size]}`} aria-hidden="true">
      {pet.imageUrl ? <img src={pet.imageUrl} alt="" /> : getPetEmoji(pet.species)}
    </span>
  )
}
