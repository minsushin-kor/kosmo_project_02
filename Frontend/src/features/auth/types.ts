export type AuthUser = {
  userId: number
  name: string
  username: string
  email: string
  phone: string
  postalCode?: string
  address?: string
  detailAddress?: string
  role: 'USER' | 'ADMIN'
}

export type SignupInput = {
  loginId: string
  password: string
  email: string
  userName: string
  phone: string
  postalCode: string
  address: string
  detailAddress: string
}

export type UpdateProfileInput = {
  userName: string
  email: string
  phone: string
  currentPassword: string | null
  newPassword: string | null
  postalCode: string
  address: string
  detailAddress: string
}
