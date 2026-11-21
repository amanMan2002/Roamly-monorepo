import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PostsService, PostResponse } from '../../services/posts.service';
import { UserProfile, UserService } from '../../services/user.service';
import { KeepsService } from '../../services/keeps.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly postsService = inject(PostsService);
  readonly keepsService = inject(KeepsService);

  readonly loggedInUsername = computed(() => this.authService.currentUser() || 'Traveler');
  readonly routeUsername = signal<string | null>(null);

  readonly profileUsername = computed(() => this.routeUsername() || this.loggedInUsername());
  readonly isOwnProfile = computed(() => {
    const target = this.routeUsername();
    if (!target) return true;
    return target.toLowerCase() === this.loggedInUsername().toLowerCase();
  });

  readonly profile = signal<UserProfile | null>(null);
  readonly totalLikesReceived = signal<number>(0);
  readonly loadingProfile = signal<boolean>(true);
  readonly profileError = signal<string>('');

  readonly allPosts = signal<PostResponse[]>([]);
  readonly loadingPosts = signal<boolean>(true);

  readonly activeTab = signal<'entries' | 'kept'>('entries');
  readonly selectedPost = signal<PostResponse | null>(null);
  readonly modalImageIndex = signal<number>(0);

  readonly authoredPosts = computed(() => {
    const prof = this.profile();
    if (prof?.posts && Array.isArray(prof.posts) && prof.posts.length > 0) {
      return prof.posts;
    }
    const target = this.profileUsername().toLowerCase();
    return this.allPosts().filter(post => this.extractRawUsername(post).toLowerCase() === target);
  });

  readonly keptPosts = computed(() => {
    const prof = this.profile();
    const serverKept = prof?.keptPosts ?? prof?.likedPosts;
    if (this.isOwnProfile() && Array.isArray(serverKept) && serverKept.length > 0) {
      return serverKept;
    }
    const keptIds = this.keepsService.keptPostIds();
    return this.allPosts().filter(post => keptIds.has(post.id));
  });

  readonly entriesCount = computed(() => {
    const prof = this.profile();
    const authored = this.authoredPosts().length;
    if (authored > 0) return authored;
    const serverCount = prof?.postsCount ?? prof?.totalPosts;
    return typeof serverCount === 'number' ? serverCount : 0;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const uname = params.get('username');
      this.routeUsername.set(uname ? uname.replace(/^@/, '') : null);
      if (!this.isOwnProfile() && this.activeTab() === 'kept') {
        this.activeTab.set('entries');
      }
      this.loadProfileData();
      this.loadPosts();
    });
  }

  loadProfileData(): void {
    this.loadingProfile.set(true);
    this.profileError.set('');
    const target = this.routeUsername();

    const request$ = !target || this.isOwnProfile()
      ? this.userService.getCurrentUserProfile()
      : this.userService.getUserProfile(target);

    request$.subscribe({
      next: (data) => {
        this.profile.set(data);
        const likes = data.totalLikesReceived ?? data.likesReceived ?? data.totalLikes;
        if (typeof likes === 'number') {
          this.totalLikesReceived.set(likes);
          this.loadingProfile.set(false);
        } else {
          this.fetchLikesFallback(data.username || this.profileUsername());
        }
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.loadingProfile.set(false);
        // Fallback to quick likes endpoint if profile endpoint fails
        this.fetchLikesFallback(this.profileUsername());
        if (err?.status === 404) {
          this.profileError.set(`No traveller found for @${this.profileUsername()}.`);
        }
      }
    });
  }

  private fetchLikesFallback(username: string): void {
    if (!username) {
      this.loadingProfile.set(false);
      return;
    }
    this.userService.getTotalLikesReceived(username).subscribe({
      next: (res) => {
        if (typeof res?.totalLikesReceived === 'number') {
          this.totalLikesReceived.set(res.totalLikesReceived);
        }
        this.loadingProfile.set(false);
      },
      error: () => {
        this.loadingProfile.set(false);
      }
    });
  }

  loadPosts(): void {
    this.loadingPosts.set(true);
    this.postsService.findAll().subscribe({
      next: (data) => {
        const sorted = Array.isArray(data) ? [...data].reverse() : [];
        this.allPosts.set(sorted);
        this.keepsService.syncFromPosts(sorted);
        this.loadingPosts.set(false);
      },
      error: () => {
        this.loadingPosts.set(false);
      }
    });
  }

  refreshAll(): void {
    this.loadProfileData();
    this.loadPosts();
  }

  toggleKeep(post: PostResponse, event?: Event): void {
    event?.stopPropagation();
    this.keepsService.toggleKeep(post);
    // Refresh total likes received if user kept/unkept a post authored by the viewed profile
    if (this.extractRawUsername(post).toLowerCase() === this.profileUsername().toLowerCase()) {
      const delta = this.keepsService.isKept(post.id) ? 1 : -1;
      this.totalLikesReceived.update(v => Math.max(0, v + delta));
    }
  }

  openPostModal(post: PostResponse, imageIndex = 0): void {
    this.modalImageIndex.set(imageIndex);
    this.selectedPost.set(post);
  }

  closePostModal(): void {
    this.selectedPost.set(null);
  }

  stepModalImage(step: number, total: number): void {
    if (total < 2) return;
    this.modalImageIndex.update(i => (i + step + total) % total);
  }

  extractRawUsername(post: PostResponse): string {
    if (!post) return '';
    const p = post as any;
    const name =
      p.author ||
      p.username ||
      p.userName ||
      p.user_name ||
      p.authorName ||
      p.author_name ||
      p.createdBy ||
      p.created_by ||
      p.user?.username ||
      p.user?.name ||
      p.appUser?.username ||
      p.appUser?.name ||
      p.app_user?.username ||
      '';
    return typeof name === 'string' ? name.replace(/^@/, '').trim() : '';
  }

  getPostAuthor(post: PostResponse): string {
    const raw = this.extractRawUsername(post);
    return raw ? `@${raw}` : 'Anonymous Traveller';
  }

  getPostContent(post: PostResponse): string {
    return (post.content || post.description || post.caption || post.body || '') as string;
  }

  getPostPreview(post: PostResponse, limit = 160): string {
    const text = this.getPostContent(post).trim();
    if (text.length <= limit) return text;
    const slice = text.slice(0, limit);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastSpace > Math.floor(limit * 0.6) ? slice.slice(0, lastSpace) : slice;
    return `${cut.trimEnd()}…`;
  }

  getPostImages(post: PostResponse): string[] {
    if (!post) return [];
    const p = post as any;
    const list = [p.imageUrls, p.image_urls, p.images, p.pictures, p.photos].find(
      v => Array.isArray(v) && v.length > 0
    ) as unknown[] | undefined;
    const urls = (list ?? [])
      .map(v => (typeof v === 'string' ? v : (v as any)?.url || (v as any)?.imageUrl || ''))
      .filter((u): u is string => !!u && u.trim().length > 0);
    if (urls.length > 0) return urls;
    const single = (p.coverImageUrl || p.cover_image_url || p.imageUrl || p.image || p.picture || '') as string;
    return single ? [single] : [];
  }

  getPostExactDate(post: PostResponse): string {
    const p = post as any;
    const rawDate = p?.createdAt || p?.created_at || p?.createdDate || p?.created_date || p?.timestamp;
    if (!rawDate) return '';
    try {
      const date = new Date(rawDate);
      return isNaN(date.getTime()) ? '' : date.toLocaleString();
    } catch {
      return '';
    }
  }

  padId(id: number): string {
    return String(id ?? 0).padStart(3, '0');
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
