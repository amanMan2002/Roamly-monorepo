import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface AiChatRequest {
  message?: string;
  prompt?: string;
  query?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  [key: string]: unknown;
}

export interface AiChatResponse {
  response?: string;
  message?: string;
  reply?: string;
  answer?: string;
  content?: string;
  [key: string]: unknown;
}

export interface AiDatabaseStats {
  totalPosts?: number;
  totalUsers?: number;
  totalImages?: number;
  [key: string]: unknown;
}

export interface AiStoryGenerationRequest {
  prompt?: string;
  topic?: string;
  title?: string;
  destination?: string;
  location?: string;
  keywords?: string[];
  [key: string]: unknown;
}

export interface AiPostSummary {
  id?: number;
  title?: string;
  content?: string;
  summary?: string;
  location?: string;
  author?: string;
  username?: string;
  coverImageUrl?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = 'http://localhost:8081/api/ai';

  chat(message: string, history?: Array<{ role: string; content: string }>): Observable<AiChatResponse> {
    const payload: AiChatRequest = {
      message,
      prompt: message,
      query: message,
      conversationHistory: history
    };
    return this.http.post<AiChatResponse>(`${this.BASE_URL}/chat`, payload);
  }

  getStats(): Observable<AiDatabaseStats> {
    return this.http.get<AiDatabaseStats>(`${this.BASE_URL}/stats`);
  }

  generateStory(request: AiStoryGenerationRequest): Observable<{ story: string; [key: string]: unknown }> {
    return this.http.post<{ story: string }>(`${this.BASE_URL}/generate-story`, request);
  }

  searchPosts(query: string = ''): Observable<AiPostSummary[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<AiPostSummary[]>(`${this.BASE_URL}/search-posts`, { params });
  }

  extractReply(res: AiChatResponse): string {
    if (!res) return '';
    return (
      res.response ||
      res.reply ||
      res.message ||
      res.answer ||
      res.content ||
      (typeof res === 'string' ? res : JSON.stringify(res))
    );
  }
}
