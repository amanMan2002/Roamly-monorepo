import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PostsService, PostResponse } from '../../services/posts.service';
import { AiAssistantService, AiChatMessage, AiDatabaseStats, AiPostSummary } from '../../services/ai-assistant.service';
import { KeepsService } from '../../services/keeps.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly postsService = inject(PostsService);
  private readonly aiService = inject(AiAssistantService);
  private readonly router = inject(Router);
  readonly keepsService = inject(KeepsService);

  readonly username = computed(() => this.authService.currentUser() || 'Traveler');

  // AI Assistant Drawer State
  readonly isAiDrawerOpen = signal(false);
  readonly aiActiveTab = signal<'chat' | 'stats' | 'search'>('chat');
  readonly aiMessages = signal<AiChatMessage[]>([
    {
      role: 'assistant',
      content: 'Greetings traveller! I am your Roamly AI companion. Ask me for travel tips, destination ideas, or to search stories across our community.'
    }
  ]);
  readonly aiChatInput = signal('');
  readonly aiChatLoading = signal(false);
  readonly aiChatError = signal('');

  // AI Story Assistant State
  readonly aiStoryPrompt = signal('');
  readonly aiStoryLoading = signal(false);
  readonly aiStoryError = signal('');

  // AI Database Stats State
  readonly aiStats = signal<AiDatabaseStats | null>(null);
  readonly aiStatsLoading = signal(false);

  // AI Semantic Search State
  readonly aiSearchQuery = signal('');
  readonly aiSearchResults = signal<AiPostSummary[]>([]);
  readonly aiSearchLoading = signal(false);
  readonly aiSearchSearched = signal(false);

  // Posts Feed State
  readonly posts = signal<PostResponse[]>([]);
  readonly loadingPosts = signal<boolean>(true);
  readonly errorLoading = signal<string>('');

  // Create Post Form State
  readonly postTitle = signal('');
  readonly postContent = signal('');
  readonly postLocation = signal('');
  readonly postImageUrl = signal(''); // draft URL input
  readonly postImages = signal<string[]>([]); // attached photos (max MAX_IMAGES)
  readonly MAX_IMAGES = 6;
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly submitSuccess = signal('');
  readonly isCreatePostOpen = signal(false);

  // Interaction State
  readonly likedPostIds = signal<Set<number>>(new Set());
  readonly selectedPost = signal<PostResponse | null>(null);
  readonly modalImageIndex = signal(0);

  // Quick Preset Sample Images for convenience
  readonly sampleImages = [
    { label: 'Alps', url: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Coast', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Kyoto', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Rome', url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80' }
  ];

  ngOnInit(): void {
    this.fetchPosts();
  }

  fetchPosts(): void {
    this.loadingPosts.set(true);
    this.errorLoading.set('');
    this.postsService.findAll().subscribe({
      next: (data) => {
        console.log('[HomeComponent] Posts loaded from backend:', data);
        if (data && data.length > 0) {
          console.log('[HomeComponent] First post sample structure:', data[0]);
        }
        // Sort newest first if list has IDs or timestamps
        const sorted = Array.isArray(data) ? [...data].reverse() : [];
        this.posts.set(sorted);
        this.keepsService.syncFromPosts(sorted);
        this.loadingPosts.set(false);
      },
      error: (err) => {
        console.error('Error fetching posts:', err);
        this.loadingPosts.set(false);
        this.errorLoading.set('Unable to load posts from server. Please check your backend connection.');
      }
    });
  }

  toggleCreatePost(): void {
    this.isCreatePostOpen.update(v => !v);
    this.submitError.set('');
    this.submitSuccess.set('');
  }

  /** Adds one image to the post, respecting the cap and ignoring duplicates. */
  addImage(url: string): void {
    const clean = (url || '').trim();
    if (!clean) return;
    const current = this.postImages();
    if (current.length >= this.MAX_IMAGES) {
      this.submitError.set(`You can attach up to ${this.MAX_IMAGES} photos per entry.`);
      return;
    }
    if (current.includes(clean)) return;
    this.submitError.set('');
    this.postImages.set([...current, clean]);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        this.submitError.set(`"${file.name}" is over 5MB and was skipped.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => this.addImage(reader.result as string);
      reader.readAsDataURL(file);
    }
    input.value = ''; // allow re-picking the same file
  }

  addImageFromUrl(): void {
    this.addImage(this.postImageUrl());
    this.postImageUrl.set('');
  }

  setPresetImage(url: string): void {
    this.addImage(url);
  }

  removeImage(index: number): void {
    this.postImages.update(list => list.filter((_, i) => i !== index));
  }

  // ── AI Assistant Actions ──
  toggleAiDrawer(): void {
    this.isAiDrawerOpen.update(v => !v);
    if (this.isAiDrawerOpen() && this.aiActiveTab() === 'stats' && !this.aiStats()) {
      this.loadAiStats();
    }
  }

  setAiTab(tab: 'chat' | 'stats' | 'search'): void {
    this.aiActiveTab.set(tab);
    if (tab === 'stats' && !this.aiStats()) {
      this.loadAiStats();
    }
  }

  sendAiChat(): void {
    const text = this.aiChatInput().trim();
    if (!text || this.aiChatLoading()) return;

    this.aiMessages.update(m => [...m, { role: 'user', content: text, timestamp: new Date() }]);
    this.aiChatInput.set('');
    this.aiChatLoading.set(true);
    this.aiChatError.set('');

    const history = this.aiMessages().map(m => ({ role: m.role, content: m.content }));

    this.aiService.chat(text, history).subscribe({
      next: (res) => {
        this.aiChatLoading.set(false);
        const reply = this.aiService.extractReply(res);
        this.aiMessages.update(m => [...m, { role: 'assistant', content: reply, timestamp: new Date() }]);
      },
      error: (err) => {
        this.aiChatLoading.set(false);
        console.error('AI chat error:', err);
        this.aiChatError.set(err?.error?.message || 'AI is currently offline or taking a breather.');
      }
    });
  }

  generateAiStory(): void {
    const prompt = this.aiStoryPrompt().trim() || this.postTitle().trim() || this.postLocation().trim();
    if (!prompt) {
      this.aiStoryError.set('Enter a title, destination, or story prompt first.');
      return;
    }

    this.aiStoryLoading.set(true);
    this.aiStoryError.set('');

    this.aiService.generateStory({
      prompt,
      topic: prompt,
      destination: this.postLocation().trim(),
      title: this.postTitle().trim()
    }).subscribe({
      next: (res) => {
        this.aiStoryLoading.set(false);
        if (res && res.story) {
          // Put generated story directly into the story textarea
          const existing = this.postContent().trim();
          this.postContent.set(existing ? `${existing}\n\n${res.story}` : res.story);
          this.aiStoryPrompt.set('');
        }
      },
      error: (err) => {
        this.aiStoryLoading.set(false);
        console.error('AI story generation error:', err);
        this.aiStoryError.set(err?.error?.message || 'Could not draft story. Please try again.');
      }
    });
  }

  loadAiStats(): void {
    this.aiStatsLoading.set(true);
    this.aiService.getStats().subscribe({
      next: (stats) => {
        this.aiStats.set(stats);
        this.aiStatsLoading.set(false);
      },
      error: (err) => {
        console.error('AI stats error:', err);
        this.aiStatsLoading.set(false);
      }
    });
  }

  runAiSearch(): void {
    const q = this.aiSearchQuery().trim();
    this.aiSearchLoading.set(true);
    this.aiSearchSearched.set(true);

    this.aiService.searchPosts(q).subscribe({
      next: (results) => {
        this.aiSearchResults.set(results || []);
        this.aiSearchLoading.set(false);
      },
      error: (err) => {
        console.error('AI search error:', err);
        this.aiSearchLoading.set(false);
      }
    });
  }

  selectPostFromAiSearch(postSummary: AiPostSummary): void {
    if (postSummary.id) {
      // Find post in loaded feed or fetch by id
      const found = this.posts().find(p => p.id === postSummary.id);
      if (found) {
        this.openPostModal(found);
      } else {
        this.postsService.findById(postSummary.id).subscribe({
          next: (p) => this.openPostModal(p),
          error: () => {
            // fallback construct
            this.openPostModal({
              id: postSummary.id!,
              title: postSummary.title,
              content: postSummary.content || postSummary.summary,
              location: postSummary.location,
              author: postSummary.author || postSummary.username,
              coverImageUrl: postSummary.coverImageUrl
            });
          }
        });
      }
    }
  }

  createPost(): void {
    if (!this.postTitle().trim()) {
      this.submitError.set('Please provide a title for your post.');
      return;
    }
    if (!this.postContent().trim()) {
      this.submitError.set('Please provide some content or description.');
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set('');

    const user = this.username();
    const images = this.postImages();

    this.postsService.createPost({
      title: this.postTitle().trim(),
      content: this.postContent().trim(),
      imageUrls: images,
      location: this.postLocation().trim(),
      username: user,
      author: user
    }).subscribe({
      next: (newPost) => {
        this.submitting.set(false);
        this.submitSuccess.set('Entry filed. It is now in the logbook.');

        // Ensure newly created post immediately has the author and all photos on the client
        const postWithAuthor: PostResponse = {
          ...newPost,
          author: (newPost as any).author || (newPost as any).username || user,
          username: (newPost as any).username || (newPost as any).author || user,
          imageUrls: (newPost as any).imageUrls?.length ? (newPost as any).imageUrls : images
        };

        // Reset form
        this.postTitle.set('');
        this.postContent.set('');
        this.postLocation.set('');
        this.postImageUrl.set('');
        this.postImages.set([]);

        // Prepend to posts list so user sees it instantly
        this.posts.update(current => [postWithAuthor, ...current]);

        // Auto close creator after short delay
        setTimeout(() => {
          this.submitSuccess.set('');
          this.isCreatePostOpen.set(false);
        }, 1500);
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Error creating post:', err);
        this.submitError.set(err?.error?.message || 'Failed to publish post. Please verify your backend server.');
      }
    });
  }

  toggleLike(post: PostResponse): void {
    this.keepsService.toggleKeep(post);
  }

  isLiked(postId: number): boolean {
    return this.keepsService.isKept(postId);
  }

  getLikesCount(post: PostResponse): number {
    return this.keepsService.getLikesCount(post);
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

  // Helper getters for robust property extraction across DTO variations
  getPostContent(post: PostResponse): string {
    return (post.content || post.description || post.caption || post.body || '') as string;
  }

  /** Returns a truncated preview of the post story for feed cards. */
  getPostPreview(post: PostResponse, limit = 180): string {
    const text = this.getPostContent(post).trim();
    if (text.length <= limit) return text;
    const slice = text.slice(0, limit);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastSpace > Math.floor(limit * 0.6) ? slice.slice(0, lastSpace) : slice;
    return `${cut.trimEnd()}…`;
  }

  getPostImage(post: PostResponse): string {
    if (!post) return '';
    const p = post as any;
    return (
      p.coverImageUrl ||
      p.cover_image_url ||
      p.imageUrl ||
      p.image ||
      p.picture ||
      p.pictureUrl ||
      p.photo ||
      p.photoUrl ||
      p.pic ||
      p.img ||
      p.imgUrl ||
      ''
    ) as string;
  }

  /** All photos for a post: the `imageUrls`/`images` array if present, else the single cover image. */
  getPostImages(post: PostResponse): string[] {
    if (!post) return [];
    const p = post as any;
    const list = [p.imageUrls, p.image_urls, p.images, p.pictures, p.photos].find(v => Array.isArray(v) && v.length > 0) as unknown[] | undefined;
    const urls = (list ?? [])
      .map(v => (typeof v === 'string' ? v : (v as any)?.url || (v as any)?.imageUrl || ''))
      .filter((u): u is string => !!u && u.trim().length > 0);
    if (urls.length > 0) return urls;
    const single = this.getPostImage(post);
    return single ? [single] : [];
  }

  hasImage(post: PostResponse): boolean {
    return this.getPostImages(post).length > 0;
  }

  getPostAuthor(post: PostResponse): string {
    if (!post) return 'Anonymous Traveller';
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

    if (name && typeof name === 'string' && name.trim().length > 0) {
      return name.startsWith('@') ? name : `@${name.trim()}`;
    }

    return 'Anonymous Traveller';
  }

  getPostAuthorUsername(post: PostResponse): string {
    const author = this.getPostAuthor(post);
    return author === 'Anonymous Traveller' ? '' : author.replace(/^@/, '');
  }

  getPostTimestamp(post: PostResponse): string {
    if (!post) return '';
    const p = post as any;
    const rawDate = p.createdAt || p.created_at || p.createdDate || p.created_date || p.timestamp;
    if (!rawDate) return '';

    try {
      const date = new Date(rawDate);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return '';
    }
  }

  getPostExactDate(post: PostResponse): string {
    if (!post) return '';
    const p = post as any;
    const rawDate = p.createdAt || p.created_at || p.createdDate || p.created_date || p.timestamp;
    if (!rawDate) return '';
    try {
      const date = new Date(rawDate);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString();
    } catch {
      return '';
    }
  }

  /** Entry number for the card, e.g. 7 -> "007". */
  padId(id: number): string {
    return String(id ?? 0).padStart(3, '0');
  }

  /** Postmark parts for the rubber-stamp timestamp, e.g. { day: '26', month: 'OCT', year: '2026' }. */
  getPostStamp(post: PostResponse): { day: string; month: string; year: string } | null {
    const p = post as any;
    const rawDate = p?.createdAt || p?.created_at || p?.createdDate || p?.created_date || p?.timestamp;
    if (!rawDate) return null;
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return null;
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      year: String(date.getFullYear())
    };
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80'; // fallback travel photo
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
