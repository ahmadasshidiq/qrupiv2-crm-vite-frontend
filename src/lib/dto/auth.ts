export type LoginRequestDto = {
  email: string
  password: string
  remember_me?: boolean
}

export type AuthUserDto = {
  id: string
  name: string
  email: string
  avatar_url?: string | null
  type?: 'student' | 'teacher' | 'admin' | 'staff' | string
  role: string | { id?: string; name?: string; slug?: string; permissions?: Array<{ model: string; action: string }> }
  institution?: {
    id?: string
    name?: string
    avatar_url?: string | null
    file_url?: string | null
  } | null
}

export type LoginResponseDto = {
  accessToken: string
  refreshToken?: string
  user: AuthUserDto
}
