export type DemoAccount = {
  name: string
  username: string
  email: string
  phone: string
  postalCode: string
  address: string
  detailAddress: string
  password: string
}

export type AuthUser = Omit<DemoAccount, 'password'>

export type AuthResult = {
  success: boolean
  message?: string
}
