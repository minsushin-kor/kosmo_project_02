import { Link } from 'react-router-dom'
import { usePets } from '../hooks/usePets'
import { getPetAge } from '../types'
import { PetAvatar } from './PetAvatar'
import styles from './PetSelector.module.css'

export function PetSelector() {
  const { pets, selectedPet, selectPet } = usePets()

  return (
    <div className={styles.selector}>
      <PetAvatar pet={selectedPet} size="small" />
      <label className={styles.field}>
        <span className={styles.srOnly}>현재 반려동물 선택</span>
        <select
          value={selectedPet.id}
          onChange={(event) => selectPet(Number(event.target.value))}
        >
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name} · {pet.breed}
            </option>
          ))}
        </select>
        <small>{selectedPet.breed} · {getPetAge(selectedPet.birthDate)}</small>
      </label>
      <Link to="/pets" aria-label="반려동물 관리">관리</Link>
    </div>
  )
}
