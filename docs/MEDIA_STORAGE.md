# Media Storage

Lifestory stores family graph data in Postgres and stores uploaded photos in an
S3-compatible object bucket. Postgres should keep only public URLs and metadata.

## Required Environment Variables

Set these in production before selling media-heavy packages:

```env
S3_ENDPOINT="https://<account>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_ACCESS_KEY="<access-key>"
S3_SECRET_KEY="<secret-key>"
S3_BUCKET="lifestory-media"
S3_PUBLIC_BASE_URL="https://media.lifestory.co.id"
MEDIA_FILE_MAX_BYTES="5242880"
MEDIA_TREE_QUOTA_BYTES="5368709120"
MEDIA_UPLOAD_URL_TTL_SECONDS="600"
```

`S3_PUBLIC_BASE_URL` must serve objects publicly, usually through a bucket public
domain or CDN custom domain.

## Bucket CORS

Allow browser uploads from the app origin:

```json
[
  {
    "AllowedOrigins": ["https://lifestory.co.id"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Add `https://www.lifestory.co.id` if that host is used for logged-in users.

## Production Smoke

1. Open the same tree in two logged-in sessions.
2. Upload one profile photo.
3. Upload several gallery photos.
4. Save the profile and wait for `Saved`.
5. Refresh both sessions and confirm every image still loads.
6. Run `npm run db:audit` and verify no missing media metadata columns.
7. Run `ALLOW_MEDIA_SMOKE=1 MEDIA_SMOKE_BASE_URL=https://lifestory.co.id npm run media:smoke`.
