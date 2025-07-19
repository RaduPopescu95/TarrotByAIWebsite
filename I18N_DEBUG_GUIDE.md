# 🔍 i18n Debugging Guide

Acest ghid explică cum să debugging-uiți problemele cu internationalizarea (i18n) în aplicația TarrotByAI.

## 🚀 Quick Start

### Activarea log-urilor pentru development local:
```bash
npm run dev:debug
```

### Building cu log-uri activate:
```bash
npm run build:debug
```

### Activarea log-urilor pe Vercel:
Adaugă environment variable: `ENABLE_I18N_LOGS=true`

### Dezactivarea log-urilor:
Adaugă environment variable: `DISABLE_I18N_LOGS=true`

## 📊 Tipuri de log-uri implementate

### 1. **CONFIG LOGS** 🔧
- **Locație**: `next-i18next.config.js`
- **Ce afișează**: Configurația i18n, căile fișierelor, existența fișierelor de traducere
- **Pattern**: `[CONFIG]`

### 2. **SERVER-SIDE LOGS** 🌍
- **Locație**: `pages/_app.js` și pagini individuale
- **Ce afișează**: SSR translations loading, locale detection, namespace loading
- **Pattern**: `[SSR]`

### 3. **CLIENT-SIDE LOGS** 🖥️ 
- **Locație**: `pages/_app.js` și componente
- **Ce afișează**: Language detection, router locale changes, localStorage operations
- **Pattern**: `[CLIENT]`

### 4. **LANGUAGE DETECTOR LOGS** 🎯
- **Locație**: `lib/languageDetector.js`
- **Ce afișează**: Language detection process, fallbacks, caching
- **Pattern**: `[DETECTOR]`

### 5. **COMPONENT-SPECIFIC LOGS** 🔍
- **Locație**: Componente individuale (ex: `CitirePersonalizata`)
- **Ce afișează**: i18n status în componente, translation function availability
- **Pattern**: `[i18n-DEBUG]`

### 6. **TRANSLATION TESTING** 🔤
- **Locație**: Orice componentă folosind `testTranslations()`
- **Ce afișează**: Rezultatele traducerilor pentru chei specifice
- **Pattern**: `[TRANSLATION-TEST]`

## 🛠️ Cum să folosești logging-ul în componente

### Import utilities:
```javascript
import { logI18nStatus, testTranslations } from "../../utils/i18nLogger";
```

### În componenta ta:
```javascript
export default function MyComponent() {
  const { t, i18n } = useTranslation("common");
  const router = useRouter();

  // Debug i18n status
  React.useEffect(() => {
    logI18nStatus('MyComponent', { 
      t, 
      i18n, 
      router, 
      additionalInfo: { customData: 'value' } 
    });
    
    // Test specific translations
    testTranslations(t, ['key1', 'key2', 'key3']);
  }, [t, i18n, router.locale, router.isReady]);
  
  return <div>{t('hello')}</div>;
}
```

## 🔍 Log Patterns să cauți

### ✅ **SUCCESS PATTERNS:**
```
✅ [SSR] serverSideTranslations success
✅ [CONFIG] Final next-i18next config
🎯 [DETECTOR] Language detected: { detected: "ro" }
🔍 [i18n-DEBUG] Component: { hasT: true, i18nIsInitialized: true }
```

### ❌ **ERROR PATTERNS:**
```
❌ [SSR] serverSideTranslations failed
❌ [DETECTOR] Detection failed
❌ [TRANSLATION-TEST] key failed
🔍 [i18n-DEBUG] Component: { hasT: false, testHello: "NO_T_FUNCTION" }
```

### ⚠️ **WARNING PATTERNS:**
```
🔍 [i18n-DEBUG] Component: { testHello: "MISSING_hello" }
🔤 [TRANSLATION-TEST] key: MISSING_key
```

## 🚨 Common Issues & Solutions

### 1. **"NO_T_FUNCTION" în log-uri**
- **Cauza**: useTranslation nu returnează funcția `t`
- **Soluție**: Verifică că ești în component wrapped cu `appWithTranslation`

### 2. **"MISSING_key" pentru traduceri**
- **Cauza**: Cheia nu există în `common.json`
- **Soluție**: Adaugă cheia în fișierele de traducere

### 3. **SSR translation loading failed**
- **Cauza**: Fișierele de traducere nu sunt găsite
- **Soluție**: Verifică că `public/locales/[lang]/common.json` există

### 4. **Language detection eșuează**
- **Cauza**: localStorage/browser issues
- **Soluție**: Verifică fallback logic în languageDetector

## 🎛️ Environment Variables

| Variable | Purpose | Values |
|----------|---------|--------|
| `ENABLE_I18N_LOGS` | Activează log-uri în production | `true`/`false` |
| `DISABLE_I18N_LOGS` | Dezactivează complet log-urile | `true`/`false` |
| `NODE_ENV` | Environment type | `development`/`production` |
| `VERCEL_ENV` | Vercel environment | `preview`/`production` |

## 📁 Files cu logging implementat

- ✅ `next-i18next.config.js` - Config validation
- ✅ `lib/languageDetector.js` - Language detection
- ✅ `pages/_app.js` - Global i18n status
- ✅ `pages/citire-personalizata/index.jsx` - Component example
- ✅ `utils/i18nLogger.js` - Logging utilities

## 🧪 Testing Checklist

1. **Local Development:**
   ```bash
   npm run dev:debug
   # Verifică console logs pentru patterns ✅
   ```

2. **Production Build:**
   ```bash
   npm run build:debug
   # Verifică că build-ul trece fără erori ❌
   ```

3. **Vercel Deployment:**
   - Setează `ENABLE_I18N_LOGS=true` în Vercel dashboard
   - Verifică Function Logs în Vercel pentru patterns specifice

4. **Component Testing:**
   - Deschide DevTools Console
   - Navighează la pagini cu i18n
   - Caută patterns `[i18n-DEBUG]` și `[TRANSLATION-TEST]`

## 🎯 Next Steps

După ce identifici problema cu log-urile:

1. **Config Issues** → Repară `next-i18next.config.js`
2. **Missing Files** → Verifică `public/locales/` structure  
3. **SSR Issues** → Verifică `serverSideTranslations` calls
4. **Component Issues** → Verifică `useTranslation` usage
5. **Detection Issues** → Verifică `languageDetector` logic

---

💡 **Tip**: Folosește `npm run dev:debug` mereu când debug-uiești probleme i18n! 