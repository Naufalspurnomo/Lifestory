const items = [
  { title: "Vintage Wedding", desc: "A timeless moment from the 1950s." },
  { title: "Family Home", desc: "Grandma’s original home in Bandung." },
  { title: "Graduation Day", desc: "Celebrating milestones together." },
  { title: "Holiday", desc: "Three generations on vacation." }
];

export default function GalleryPage() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">Gallery</p>
          <h1 className="text-3xl font-semibold text-slate-900">Public digital album</h1>
          <p className="text-slate-700">
            Selected photos, videos, and documents curated by the family admin.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
            >
              <div className="h-40 rounded-lg bg-forest-100" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
