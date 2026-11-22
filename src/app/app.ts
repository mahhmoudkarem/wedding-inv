import {
  AfterViewInit, Component, ElementRef, OnDestroy, ViewChild,
  computed, inject, signal
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WEDDING } from './wedding.config';

interface Petal { left: number; delay: number; duration: number; size: number; drift: number; kind: string; }
interface CalDay { day: number | null; isWedding: boolean; }

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('audio') audioRef!: ElementRef<HTMLAudioElement>;

  readonly w = WEDDING;
  readonly rot6 = [0, 60, 120, 180, 240, 300];
  private readonly sanitizer = inject(DomSanitizer);
  private readonly weddingDate = new Date(WEDDING.date);
  private timer?: ReturnType<typeof setInterval>;
  private observer?: IntersectionObserver;

  // state
  readonly opening = signal(false);
  readonly opened = signal(false);
  readonly playing = signal(false);
  readonly copied = signal(false);
  readonly now = signal(Date.now());

  readonly mapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://maps.google.com/maps?q=${encodeURIComponent(WEDDING.venue.embedQuery)}&z=15&output=embed`
  );

  // ---------- Date helpers ----------
  private readonly fmt = (opts: Intl.DateTimeFormatOptions, locale = 'en-US') =>
    new Intl.DateTimeFormat(locale, { timeZone: 'Africa/Cairo', ...opts }).format(this.weddingDate);

  readonly dayName = this.fmt({ weekday: 'long' });
  readonly dayNum = this.fmt({ day: 'numeric' });
  readonly monthName = this.fmt({ month: 'long' });
  readonly year = this.fmt({ year: 'numeric' });
  readonly time = this.fmt({ hour: 'numeric', minute: '2-digit' });
  readonly dateEn = this.fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }, 'en-GB').replace(/\//g, ' . ');

  readonly calendar: CalDay[] = this.buildCalendar();
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly countdown = computed(() => {
    const diff = Math.max(0, this.weddingDate.getTime() - this.now());
    return {
      done: diff === 0,
      days: Math.floor(diff / 86400000),
      hours: Math.floor(diff / 3600000) % 24,
      minutes: Math.floor(diff / 60000) % 60,
      seconds: Math.floor(diff / 1000) % 60,
    };
  });

  readonly petals: Petal[] = Array.from({ length: 22 }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 12,
    duration: 9 + Math.random() * 9,
    size: 10 + Math.random() * 14,
    drift: (Math.random() - 0.5) * 160,
    kind: Math.random() > 0.7 ? 'heart' : 'petal',
  }));

  readonly calendarLink = (() => {
    const start = this.weddingDate;
    const end = new Date(start.getTime() + WEDDING.durationHours * 3600000);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${WEDDING.groom.en} & ${WEDDING.bride.en} Wedding`,
      dates: `${f(start)}/${f(end)}`,
      location: `${WEDDING.venue.name}, ${WEDDING.venue.address}`,
      details: 'Your presence will complete our joy 🤍',
    });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
  })();

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  // ---------- Lifecycle ----------
  ngAfterViewInit(): void {
    this.timer = setInterval(() => this.now.set(Date.now()), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.observer?.disconnect();
  }

  // ---------- Actions ----------
  openInvitation(): void {
    if (this.opening()) return;
    this.opening.set(true);
    this.play();
    setTimeout(() => {
      this.opened.set(true);
      setTimeout(() => this.setupReveal(), 50);
    }, 1600);
  }

  toggleMusic(): void {
    this.playing() ? this.pause() : this.play();
  }

  private play(): void {
    const a = this.audioRef?.nativeElement;
    if (!a) return;
    a.volume = 0.8;
    a.play().then(() => this.playing.set(true)).catch(() => this.playing.set(false));
  }

  private pause(): void {
    this.audioRef?.nativeElement.pause();
    this.playing.set(false);
  }

  async share(): Promise<void> {
    const data = {
      title: `${this.w.groom.en} & ${this.w.bride.en} Wedding`,
      text: `You're invited to the wedding of ${this.w.groom.en} & ${this.w.bride.en} 🤍`,
      url: location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(location.href);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }
    } catch { /* user cancelled */ }
  }

  // ---------- Helpers ----------
  private setupReveal(): void {
    this.observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          this.observer?.unobserve(e.target);
        }
      }),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach(el => this.observer!.observe(el));
  }

  private buildCalendar(): CalDay[] {
    // تاريخ الفرح بتوقيت القاهرة
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo', year: 'numeric', month: 'numeric', day: 'numeric'
    }).formatToParts(this.weddingDate);
    const get = (t: string) => Number(parts.find(p => p.type === t)!.value);
    const y = get('year'), m = get('month') - 1, d = get('day');

    const firstDow = new Date(y, m, 1).getDay();       // 0 = Sunday
    const offset = firstDow;                            // week starts Sunday
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const cells: CalDay[] = [];
    for (let i = 0; i < offset; i++) cells.push({ day: null, isWedding: false });
    for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, isWedding: i === d });
    return cells;
  }

  toAr(n: number | null): string {
    return n === null ? '' : String(n);
  }
}
