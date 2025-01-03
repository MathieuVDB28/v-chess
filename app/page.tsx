export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl lg:text-5xl">v-chess</h2>
          </div>
        </div>
          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <span>Entrez votre pseudo chess.com</span>
            <input type="text" className="border-2 border-[hsl(var(--border))]"/>
          </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
          <span>Made by <a href="https://github.com/MathieuVDB28" className="text-[hsl(var(--primary))]">MathieuVDB</a></span>
      </footer>
    </div>
  );
}
