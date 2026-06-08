export interface PublicUserDTO {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  joinedAt: Date;
}

export interface PrivateUserDTO extends PublicUserDTO {
  email: string;
}

export interface AdminUserDTO extends PrivateUserDTO {
  roles: string[];
  lastLogin: Date;
}
