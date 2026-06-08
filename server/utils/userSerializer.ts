import { PublicUserDTO, PrivateUserDTO, AdminUserDTO } from '../types/PublicUserDTO.js';

export function toPublicUserDTO(user: any): PublicUserDTO {
  if (!user) return user;

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name || user.username,
    avatarUrl: user.avatar_url || null,
    bio: user.bio || null,
    joinedAt: user.joined_at || user.created_at || new Date(),
  };
}

export function toPrivateUserDTO(user: any): PrivateUserDTO {
  if (!user) return user;

  return {
    ...toPublicUserDTO(user),
    email: user.email,
  };
}

export function toAdminUserDTO(user: any): AdminUserDTO {
  if (!user) return user;

  return {
    ...toPrivateUserDTO(user),
    roles: Array.isArray(user.admin_roles)
      ? user.admin_roles
      : user.admin_roles
        ? [user.admin_roles]
        : [],
    lastLogin: user.last_login || new Date(),
  };
}
