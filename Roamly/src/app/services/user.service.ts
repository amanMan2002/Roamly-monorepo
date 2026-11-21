import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostResponse } from './posts.service';

export interface UserProfile {
  id?: number;
  username: string;
  totalLikesReceived?: number;
  totalLikes?: number;
  likesReceived?: number;
  postsCount?: number;
  totalPosts?: number;
  posts?: PostResponse[];
  likedPosts?: PostResponse[];
  keptPosts?: PostResponse[];
  createdAt?: string;
  [key: string]: unknown;
}

export interface UserLikesResponse {
  username: string;
  totalLikesReceived: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = 'http://localhost:8081/api/users';

  /** Retrieves the profile and stats (including total likes received) for the logged-in user. */
  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE_URL}/profile`);
  }

  /** Retrieves the public profile and stats (including total likes received) for any author. */
  getUserProfile(username: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE_URL}/profile/${encodeURIComponent(username)}`);
  }

  /** Quick lookup for total likes received by an author across all their posts. */
  getTotalLikesReceived(username: string): Observable<UserLikesResponse> {
    return this.http.get<UserLikesResponse>(`${this.BASE_URL}/${encodeURIComponent(username)}/likes`);
  }
}
