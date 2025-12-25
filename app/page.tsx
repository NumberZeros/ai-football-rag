import FixturesPage from '@/components/fixtures-page';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-10">
      <header className="mb-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            AI Football Reports
          </h1>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
            Pre-match analysis for commentators and analysts
          </p>
        </div>
      </header>

      <FixturesPage />
    </main>
  );
}
