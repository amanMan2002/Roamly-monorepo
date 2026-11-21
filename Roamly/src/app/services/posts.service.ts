import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreatePostRequest {
  title: string;
  content: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  image?: string;
  picture?: string;
  pictureUrl?: string;
  photo?: string;
  photoUrl?: string;
  location?: string;
  author?: string;
  username?: string;
  user?: string;
  createdBy?: string;
  [key: string]: unknown;
}

export interface PostResponse {
  id: number;
  title?: string;
  content?: string;
  description?: string;
  caption?: string;
  body?: string;
  imageUrl?: string;
  image?: string;
  picture?: string;
  pictureUrl?: string;
  photo?: string;
  photoUrl?: string;
  pic?: string;
  img?: string;
  imgUrl?: string;
  location?: string;
  author?: string;
  authorName?: string;
  username?: string;
  userName?: string;
  user?: any;
  user_name?: string;
  author_name?: string;
  createdBy?: string;
  created_by?: string;
  appUser?: any;
  app_user?: any;
  createdAt?: string;
  created_at?: string;
  createdDate?: string;
  created_date?: string;
  timestamp?: string;
  updatedAt?: string;
  updated_at?: string;
  likesCount?: number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = 'http://localhost:8081/api/posts';

  findAll(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(this.BASE_URL);
  }

  findById(id: number): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.BASE_URL}/${id}`);
  }

  createPost(request: CreatePostRequest): Observable<PostResponse> {
    const urls = (request.imageUrls?.length ? request.imageUrls : [request.imageUrl || request.image || request.picture || ''])
      .filter(u => !!u);
    const img = urls[0] || '';
    // coverImageUrl = first photo (maps to cover_image_url); imageUrls = every photo
    const payload: Record<string, unknown> = {
      title: request.title,
      content: request.content,
      description: request.content,
      coverImageUrl: img,
      imageUrls: urls,
      imageUrl: img,
      image: img,
      picture: img,
      pictureUrl: img,
      photo: img,
      photoUrl: img,
      pic: img,
      location: request.location || '',
      author: request.author || request.username || '',
      username: request.username || request.author || '',
      userName: request.username || request.author || '',
      createdBy: request.username || request.author || ''
    };
    return this.http.post<PostResponse>(this.BASE_URL, payload);
  }
}
