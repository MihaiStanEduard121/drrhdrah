export interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string;
  embedCode: string;
  isOnline: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ChannelApiResponse {
  channels: Channel[];
  categories: string[];
  pagination: PaginationMeta;
}

export interface SingleChannelResponse {
  channel: Channel;
  similar: Channel[];
}

export interface AdminStats {
  total: number;
  online: number;
  offline: number;
  categoriesCount: number;
}
