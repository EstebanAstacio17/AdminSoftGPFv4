import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(true);

  constructor() {
    const savedTheme = localStorage.getItem('gpf-theme');
    const isDark = savedTheme ? savedTheme === 'dark' : true; // Dark mode por defecto
    this.setTheme(isDark);
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkMode());
  }

  private setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    const themeName = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('gpf-theme', themeName);
  }
}
