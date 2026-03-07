
// Script to create the 'branding' bucket in Supabase via REST API
const SUPABASE_URL = "https://[SEU_PROJETO].supabase.co";
// NOTE: This requires a SERVICE_ROLE_KEY to bypass RLS and create buckets. 
// Using the anon key might fail if policies prevent bucket creation.
// Since we don't have the service role key in .env, we'll try with the anon key and hope for the best, 
// or instruct the user to run SQL.

// However, based on the user's "Erro ao carregar logo", it's likely a permission/existence issue.
// Let's try to list buckets first.

const ANON_KEY = "[SUA_CHAVE_ANON]";

async function createBucket() {
    console.log("Checking storage buckets...");

    // List buckets
    const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        headers: {
            'Authorization': `Bearer ${ANON_KEY}`,
            'apikey': ANON_KEY
        }
    });

    if (listResponse.ok) {
        const buckets = await listResponse.json();
        console.log("Existing buckets:", buckets.map(b => b.name));

        const brandingBucket = buckets.find(b => b.name === 'branding');
        if (brandingBucket) {
            console.log("✅ Bucket 'branding' already exists.");
            return;
        }
    } else {
        console.log("Could not list buckets (likely permissions):", await listResponse.text());
    }

    console.log("Attempting to create 'branding' bucket...");

    const createResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ANON_KEY}`,
            'apikey': ANON_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: 'branding',
            name: 'branding',
            public: true,
            file_size_limit: 10485760, // 10MB
            allowed_mime_types: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif']
        })
    });

    if (createResponse.ok) {
        console.log("✅ Bucket 'branding' created successfully!");
    } else {
        console.error("❌ Failed to create bucket. Status:", createResponse.status);
        console.error("Response:", await createResponse.text());
        console.log("\n⚠️ NOTE: Creating buckets usually requires the SERVICE_ROLE_KEY.");
        console.log("If this failed, please run the following SQL in your Supabase SQL Editor:");
        console.log(`
-- SQL TO FIX STORAGE
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "Images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'branding' );

create policy "Anyone can upload an image"
  on storage.objects for insert
  with check ( bucket_id = 'branding' );

create policy "Anyone can update their own image"
  on storage.objects for update
  using ( bucket_id = 'branding' ); 
        `);
    }
}

createBucket().catch(console.error);
