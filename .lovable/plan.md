## লক্ষ্য
আপনার প্রজেক্টকে Lovable Cloud থেকে সরিয়ে **আপনার নিজের আলাদা Supabase অ্যাকাউন্ট**-এ কানেক্ট করা, যাতে সেল্ফ-হোস্ট করার পর সব ডাটাবেস/অথ/স্টোরেজ আপনার নিজের Supabase প্রজেক্টে চলে।

## গুরুত্বপূর্ণ সতর্কতা
- Lovable Cloud-এর ডাটা (products, orders, users, reviews, banners, coupons ইত্যাদি) **স্বয়ংক্রিয়ভাবে ট্রান্সফার হবে না**। আগে export করে নতুন Supabase-এ import করতে হবে।
- Auth users রপ্তানি করলে পাসওয়ার্ড হ্যাশ সহ আনতে হয় — নাহলে ইউজারদের পাসওয়ার্ড রিসেট করতে হবে।
- Storage bucket-এর ফাইলগুলো (product-images, review-images, avatars) আলাদাভাবে ডাউনলোড করে নতুন প্রজেক্টে upload করতে হবে।

## ধাপসমূহ

### ১. নতুন Supabase প্রজেক্ট তৈরি
- supabase.com-এ গিয়ে নতুন প্রজেক্ট বানান।
- Project URL, `anon` (publishable) key, এবং `service_role` key সংগ্রহ করুন।

### ২. স্কিমা মাইগ্রেট করা
- এই প্রজেক্টের `supabase/migrations/` ফোল্ডারের সব SQL ফাইল ক্রমানুসারে নতুন Supabase-এর SQL Editor-এ চালান।
- এতে সব টেবিল, RLS পলিসি, functions, triggers, enums তৈরি হবে।

### ৩. ডাটা এক্সপোর্ট ও ইম্পোর্ট
- Lovable Cloud → Advanced → Export data দিয়ে বর্তমান ডাটা ডাউনলোড করুন।
- নতুন Supabase-এ `psql` বা SQL Editor দিয়ে ইম্পোর্ট করুন (auth.users আলাদা টুল দিয়ে)।

### ৪. Storage buckets তৈরি
- নতুন Supabase-এ `product-images`, `review-images`, `avatars` buckets বানান (private)।
- পুরনো bucket-এর ফাইলগুলো ডাউনলোড করে নতুন-এ upload করুন।
- আগের RLS policies মাইগ্রেশনেই চলে আসবে।

### ৫. Auth Providers কনফিগার
- নতুন Supabase Dashboard → Authentication → Providers-এ Email এবং Google enable করুন।
- Google OAuth-এর client ID/secret আবার সেট করতে হবে।
- Redirect URLs-এ আপনার সেল্ফ-হোস্টেড ডোমেইন যোগ করুন।

### ৬. Environment variables আপডেট
`.env` ফাইলে নতুন Supabase-এর মান বসান:
```
VITE_SUPABASE_URL=<নতুন project URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<নতুন anon key>
VITE_SUPABASE_PROJECT_ID=<নতুন project ref>
SUPABASE_URL=<নতুন project URL>
SUPABASE_PUBLISHABLE_KEY=<নতুন anon key>
SUPABASE_SERVICE_ROLE_KEY=<নতুন service role key>
```

### ৭. Types regenerate
- `src/integrations/supabase/types.ts` নতুন Supabase CLI দিয়ে regenerate করুন:
  ```
  npx supabase gen types typescript --project-id <নতুন ref> > src/integrations/supabase/types.ts
  ```

### ৮. Google OAuth Broker
- বর্তমান কোডে `lovable.auth.signInWithOAuth("google", ...)` ব্যবহৃত হয়েছে — এটা Lovable-এর broker দিয়ে চলে।
- সেল্ফ-হোস্টেড এনভায়রনমেন্টে এটা কাজ করবে না; সরাসরি `supabase.auth.signInWithOAuth({ provider: "google" })`-এ বদলাতে হবে।
- Sign-in বাটন এবং auth callback route এই অনুযায়ী আপডেট হবে।

### ৯. LOVABLE_API_KEY (AI features)
- যদি Lovable AI Gateway ব্যবহৃত কোনো ফিচার থাকে, সেগুলো সেল্ফ-হোস্টে কাজ করবে না। প্রয়োজন হলে সরাসরি OpenAI/Gemini key ব্যবহার করে বদলাতে হবে (এখন কোডে বড় নির্ভরতা নেই বলে মনে হচ্ছে — যাচাই করব)।

### ১০. টেস্ট
- Local dev-এ signup, login, product listing, cart, checkout (কুপন সহ), reviews, admin panel — সব ফ্লো টেস্ট করব।

## জিজ্ঞাসা
আপনি কি চান আমি এখন এগিয়ে গিয়ে **কোড-লেভেল পরিবর্তনগুলো** (Google OAuth কে Lovable broker থেকে সরাসরি Supabase-এ বদলানো, `.env` টেমপ্লেট তৈরি, ইত্যাদি) করি? নাকি শুধু গাইড দিয়ে দেব এবং আপনি নিজে নতুন Supabase বানানোর পর আমরা কোড অ্যাডজাস্ট করব?

(ডাটা/স্টোরেজ মাইগ্রেশন এবং Supabase Dashboard-এর সেটিংস আপনাকেই করতে হবে — সেগুলো কোড থেকে করা যায় না।)
