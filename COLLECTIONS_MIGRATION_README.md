# 🚀 Collections Migration - Szybki Start

## 📋 Podsumowanie

Utworzona migracja: **`20251018120000_create_collections_table_with_rls.sql`**

### Co dodaje ta migracja?

✅ **Tabela `collections`** - organizacja questów w kolekcje  
✅ **Tabela `collection_quests`** - relacja many-to-many  
✅ **8 polityk RLS** - pełne zabezpieczenie CRUD (4 + 4)  
✅ **6 indeksów** - optymalizacja zapytań  
✅ **1 trigger** - auto-update `updated_at`

---

## ⚡ Szybkie wykonanie (Lokalnie)

```bash
# 1. Upewnij się że Supabase działa
supabase status

# 2. Wykonaj migrację
supabase db reset --local
# lub zachowaj dane:
supabase migration up --local

# 3. Wygeneruj nowe typy TypeScript
supabase gen types typescript --local > src/db/database.types.ts

# 4. Zweryfikuj
supabase db diff  # Powinno być: "No schema changes detected"
```

---

## 🌐 Wykonanie na produkcji

```bash
# 1. Zaloguj się i połącz projekt
supabase login
supabase link --project-ref <your-project-ref>

# 2. Sprawdź różnice
supabase db diff --use-migra

# 3. Wykonaj migrację
supabase db push

# 4. Wygeneruj typy
supabase gen types typescript --project-id <your-project-ref> > src/db/database.types.ts
```

---

## 🔍 Szybka weryfikacja

### Sprawdź czy tabele istnieją:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('collections', 'collection_quests');
```

### Sprawdź polityki RLS:

```sql
-- Powinno zwrócić 8 wierszy (4 dla każdej tabeli)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('collections', 'collection_quests')
ORDER BY tablename, cmd;
```

### Sprawdź czy RLS jest włączone:

```sql
-- Obie tabele powinny mieć rowsecurity = true
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('collections', 'collection_quests');
```

---

## 🧪 Szybki test funkcjonalności

```sql
-- 1. Utwórz kolekcję (jako zalogowany użytkownik)
INSERT INTO collections (name, description)
VALUES ('Test Collection', 'Testing RLS policies')
RETURNING *;

-- 2. Pobierz swoje kolekcje
SELECT * FROM collections;

-- 3. Dodaj quest do kolekcji (podstaw prawdziwe ID)
INSERT INTO collection_quests (collection_id, quest_id)
VALUES (
  (SELECT id FROM collections LIMIT 1),
  (SELECT id FROM quests LIMIT 1)
)
RETURNING *;

-- 4. Pobierz questy z kolekcji
SELECT 
  c.name as collection_name,
  q.title as quest_title
FROM collections c
JOIN collection_quests cq ON c.id = cq.collection_id
JOIN quests q ON cq.quest_id = q.id;
```

---

## 📊 Struktura tabel

### `collections`
| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | uuid | Klucz główny |
| `user_id` | uuid | Właściciel (FK → auth.users) |
| `name` | text | Nazwa (1-100 znaków) |
| `description` | text | Opis opcjonalny (1-500 znaków) |
| `color` | varchar(20) | Kolor/ikona (opcjonalnie) |
| `is_public` | boolean | Widoczność (default: false) |
| `sort_order` | integer | Kolejność wyświetlania |
| `created_at` | timestamptz | Data utworzenia |
| `updated_at` | timestamptz | Data modyfikacji |

### `collection_quests`
| Kolumna | Typ | Opis |
|---------|-----|------|
| `collection_id` | uuid | FK → collections |
| `quest_id` | uuid | FK → quests |
| `added_at` | timestamptz | Kiedy dodano |
| `sort_order` | integer | Kolejność w kolekcji |

---

## 🔐 Polityki RLS

### collections (4 polityki):
1. ✅ **SELECT** - `"Users can view own collections"`
2. ✅ **INSERT** - `"Users can insert own collections"`
3. ✅ **UPDATE** - `"Users can update own collections"`
4. ✅ **DELETE** - `"Users can delete own collections"`

### collection_quests (4 polityki):
1. ✅ **SELECT** - `"Users can view own collection quests"`
2. ✅ **INSERT** - `"Users can insert own collection quests"`
3. ✅ **UPDATE** - `"Users can update own collection quests"`
4. ✅ **DELETE** - `"Users can delete own collection quests"`

**Wszystkie polityki weryfikują własność:** `user_id = auth.uid()`

---

## 🔄 Rollback (Cofnięcie migracji)

**⚠️ UWAGA: Usunie tabele i wszystkie dane!**

```sql
-- Usuń polityki
DROP POLICY IF EXISTS "Users can delete own collection quests" ON collection_quests;
DROP POLICY IF EXISTS "Users can update own collection quests" ON collection_quests;
DROP POLICY IF EXISTS "Users can insert own collection quests" ON collection_quests;
DROP POLICY IF EXISTS "Users can view own collection quests" ON collection_quests;

DROP POLICY IF EXISTS "Users can delete own collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;
DROP POLICY IF EXISTS "Users can insert own collections" ON collections;
DROP POLICY IF EXISTS "Users can view own collections" ON collections;

-- Usuń tabele
DROP TABLE IF EXISTS collection_quests CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
```

---

## 📚 Pełna dokumentacja

Szczegółowe instrukcje: **`.ai/collections-migration-instructions.md`**

Zawiera:
- Różne metody wykonania migracji
- Szczegółową weryfikację
- Troubleshooting
- Następne kroki implementacji

---

## 🐛 Troubleshooting

| Problem | Rozwiązanie |
|---------|-------------|
| `relation does not exist` | Uruchom poprzednie migracje: `supabase db reset` |
| `permission denied` | Sprawdź polityki RLS i czy jesteś zalogowany |
| Nie widzę tabel | Odśwież Supabase Studio lub sprawdź logi migracji |
| TypeScript errors | Wygeneruj ponownie typy i zrestartuj TS Server |

---

## ✅ Checklist

- [ ] Migracja wykonana pomyślnie
- [ ] Tabele `collections` i `collection_quests` istnieją
- [ ] 8 polityk RLS jest aktywnych
- [ ] RLS jest włączone na obu tabelach
- [ ] Typy TypeScript wygenerowane
- [ ] Test CRUD operacji przeszedł pomyślnie
- [ ] Gotowe do implementacji frontendu

---

## 🎯 Następne kroki

1. **Frontend Components:**
   - `CreateCollectionForm.tsx` - formularz tworzenia kolekcji
   - `CollectionCard.tsx` - wyświetlanie kolekcji
   - `CollectionList.tsx` - lista wszystkich kolekcji
   - `AddToCollectionModal.tsx` - dodawanie questa do kolekcji

2. **API Endpoints (opcjonalnie):**
   - `GET /api/collections` - pobierz wszystkie kolekcje
   - `POST /api/collections` - utwórz kolekcję
   - `PUT /api/collections/:id` - aktualizuj kolekcję
   - `DELETE /api/collections/:id` - usuń kolekcję
   - `POST /api/collections/:id/quests` - dodaj quest
   - `DELETE /api/collections/:id/quests/:questId` - usuń quest

3. **UI/UX:**
   - Dashboard z zakładką "Kolekcje"
   - Drag & drop do organizowania questów
   - Kolory i ikony dla kolekcji
   - Licznik questów w kolekcji

---

**Migracja gotowa do użycia! 🎉**

