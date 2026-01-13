export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-5xl px-6 py-16 space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">About</p>
          <h1 className="text-3xl font-semibold text-slate-900">The Lifestory vision</h1>
        </div>
        <p className="text-lg text-slate-700">
          Lifestory is a premium, secure family hub. We help families preserve their lineage,
          memories, and archives with a beautiful, modern experience backed by subscription access.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Security first", desc: "Paid members-only area with strong authentication." },
            { title: "Rich archives", desc: "Store biographies, documents, and galleries per member." },
            { title: "Interactive trees", desc: "Smooth navigation across generations." }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800"
            >
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
