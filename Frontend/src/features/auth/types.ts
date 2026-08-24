export type AuthUser = {
  userId: number
  name: string
  username: string
  email: string
  phone: string
  role: 'USER' | 'ADMIN'
}

export type SignupInput = {
  loginId: string
  password: string
  email: string
  userName: string
  phone: string
}
