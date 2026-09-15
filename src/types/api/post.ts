export type PostAuthor = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export type PostMedia = {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
  sortOrder: number;
  placeId: number | null;
  placeName?: string | null;
};

export type FeedPost = {
  id: number;
  author: PostAuthor;
  content: string;
  thumbnailUrl: string | null;
  mediaCount: number;
  placeName: string | null;
  categories: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
  createdAgo: string;
};

export type PostDetail = {
  id: number;
  author: PostAuthor;
  content: string;
  mediaList: PostMedia[];
  categories: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
  createdAgo: string;
  updatedAt: string;
};

export type FeedResponse = {
  items: FeedPost[];
  nextCursor: number | null;
};

export type CreatePostRequest = {
  content: string;
  mediaList: PostMedia[];
  categories: string[];
};

export type LikeResponse = {
  likeCount: number;
  liked: boolean;
};

export type PostComment = {
  id: number;
  author: PostAuthor;
  content: string;
  likeCount: number;
  liked: boolean;
  createdAt: string;
  createdAgo: string;
  deleted: boolean;
  hiddenReason: string | null;
  replies: PostComment[];
};

export type CommentListResponse = {
  items: PostComment[];
  nextCursor: number | null;
};

export type CreateCommentResponse = PostComment & {
  postCommentCount: number;
};

export type DeleteCommentResponse = {
  postCommentCount: number;
};
