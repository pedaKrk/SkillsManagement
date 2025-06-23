import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'de' | 'en';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguageSubject = new BehaviorSubject<Language>('de');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(private translateService: TranslateService) {
    this.initializeTranslation();
  }

  private initializeTranslation(): void {
    // languages
    this.translateService.addLangs(['de', 'en']);
    
    // default language
    this.translateService.setDefaultLang('de');
    
    // current language from localStorage or browser setting
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    const browserLanguage = this.translateService.getBrowserLang();
    
    const initialLanguage: Language = savedLanguage || 
      (browserLanguage && ['de', 'en'].includes(browserLanguage) ? browserLanguage as Language : 'de');
    
    this.setLanguage(initialLanguage);
  }

  public setLanguage(language: Language): void {
    this.translateService.use(language);
    this.currentLanguageSubject.next(language);
    localStorage.setItem('preferredLanguage', language);
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  public getAvailableLanguages(): Language[] {
    return ['de', 'en'];
  }

  public getLanguageName(language: Language): string {
    return language === 'de' ? 'Deutsch' : 'English';
  }

  public translate(key: string, params?: any): Observable<string> {
    return this.translateService.get(key, params);
  }

  public instant(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }
} 