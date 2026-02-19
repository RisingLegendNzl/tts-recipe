import RecipeCard from "@/components/RecipeCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center p-6">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-terracotta/5 blur-3xl" />
        <div className="absolute -bottom-48 -left-24 w-[500px] h-[500px] rounded-full bg-sage/6 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-plum/3 blur-3xl" />
      </div>

      <RecipeCard />
    </main>
  );
}
