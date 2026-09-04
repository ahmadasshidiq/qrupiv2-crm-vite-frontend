export type LoginFormValues = {
  email: string
  password: string
  remember: boolean
}

export type LoginStatus = 'idle' | 'submitting' | 'success' | 'error'
