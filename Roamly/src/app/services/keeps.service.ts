import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { PostResponse } from './posts.service';

@Injectable({ providedIn: 'root' })
export class KeepsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly POSTS_URL = 'http://localhost:8081/api/posts';

  private readonly keptIdsState = signal<Set<number>>(this.loadFromStorage());
  private loadedForUser: string | null = this.getStorageUserKey();

  readonly keptPostIds = this.keptIdsState.asReadonly();
  readonly keptCount = computed(() => this.keptIdsState().size);

  private getStorageUserKey(): string {
    return (this.authService.currentUser() || 'guest').toLowerCase();
  }

  private storageKey(): string {
    return `roamly_kept_posts_${this.getStorageUserKey()}`;
  }

  private loadFromStorage(): Set<number> {
    if (!this.isBrowser) return new Set();
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((id): id is number => typeof id === 'number'));
      }
    } catch {
      // Ignore malformed localStorage data
    }
    return new Set();
  }

  private saveToStorage(ids: Set<number>): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(Array.from(ids)));
    } catch {
      // Ignore storage quota errors
    }
  }

  private ensureUserLoaded(): void {
    const key = this.getStorageUserKey();
    if (this.loadedForUser !== key) {
      this.loadedForUser = key;
      this.keptIdsState.set(this.loadFromStorage());
    }
  }

  isKept(postId: number): boolean {
    this.ensureUserLoaded();
    return this.keptIdsState().has(postId);
  }

  /** Merges any server-provided `liked` / `likedByCurrentUser` flags into local state. */
  syncFromPosts(posts: PostResponse[]): void {
    this.ensureUserLoaded();
    let changed = false;
    const next = new Set(this.keptIdsState());
    for (const post of posts) {
      const p = post as any;
      const serverLiked = p.likedByCurrentUser ?? p.liked ?? p.isLiked;
      if (typeof serverLiked === 'boolean') {
        if (serverLiked && !next.has(post.id)) {
          next.add(post.id);
          changed = true;
        } else if (!serverLiked && next.has(post.id)) {
          next.delete(post.id);
          changed = true;
        }
      }
    }
    if (changed) {
      this.keptIdsState.set(next);
      this.saveToStorage(next);
    }
  }

  getLikesCount(post: PostResponse): number {
    const p = post as any;
    const count = p.likesCount ?? p.likeCount ?? p.totalLikes ?? p.likes ?? 0;
    return typeof count === 'number' && !isNaN(count) ? count : 0;
  }

  /**
   * Toggles a post in the user's Kept Collection and notifies the backend like endpoint.
   */
  toggleKeep(post: PostResponse): void {
    this.ensureUserLoaded();
    const next = new Set(this.keptIdsState());
    const wasKept = next.has(post.id);
    if (wasKept) {
      next.delete(post.id);
    } else {
      next.add(post.id);
    }
    this.keptIdsState.set(next);
    this.saveToStorage(next);

    // Optimistically adjust post likesCount
    const currentCount = this.getLikesCount(post);
    const optimisticCount = Math.max(0, currentCount + (wasKept ? -1 : 1));
    post.likesCount = optimisticCount;

    // Persist to backend if the post like endpoint is available
    this.http.post<any>(`${this.POSTS_URL}/${post.id}/like`, {}).subscribe({
      next: (res) => {
        if (res && typeof res === 'object') {
          const serverCount = res.likesCount ?? res.likeCount ?? res.totalLikes ?? res.likes;
          if (typeof serverCount === 'number') {
            post.likesCount = serverCount;
          }
          const serverLiked = res.liked ?? res.likedByCurrentUser ?? res.isLiked;
          if (typeof serverLiked === 'boolean') {
            const synced = new Set(this.keptIdsState());
            if (serverLiked) synced.add(post.id);
            else synced.delete(post.id);
            this.keptIdsState.set(synced);
            this.saveToStorage(synced);
          }
        }
      },
      error: () => {
        // Keep local collection state if backend like endpoint differs or is unavailable
      }
    });
  }
}
