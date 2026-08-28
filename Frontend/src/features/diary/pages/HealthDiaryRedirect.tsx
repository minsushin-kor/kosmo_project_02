import { Navigate } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import common from '../../../styles/featurePage.module.css'
import { usePets } from '../../pets/hooks/usePets'

export function HealthDiaryRedirect() {
  const { selectedPet, isLoading } = usePets()

  if (isLoading) {
    return <div className={common.page}><DataState title="건강 다이어리를 준비하는 중입니다." isLoading /></div>
  }

  return <Navigate to={selectedPet ? `/pets/${selectedPet.id}/diary` : '/pets'} replace />
}
