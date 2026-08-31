export type PostAuthor = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export type PostMedia = {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
  sortOrder: number;
};

export type PostPlaceTag = {
  placeId: number;
  latitude: number;
  longitude: number;
};

export type FeedPost = {
  id: number;
  author: PostAuthor;
  content: string;
  thumbnailUrl: string | null;
  mediaCount: number;
  placeName: string | null;
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
};

export type PostDetail = {
  id: number;
  author: PostAuthor;
  content: string;
  mediaList: PostMedia[];
  placeTags: PostPlaceTag[];
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeedResponse = {
  items: FeedPost[];
  nextCursor: number | null;
};

export type CreatePostRequest = {
  content: string;
  mediaList: PostMedia[];
  placeTags: PostPlaceTag[];
};

export type LikeResponse = {
  likeCount: number;
  liked: boolean;
};
