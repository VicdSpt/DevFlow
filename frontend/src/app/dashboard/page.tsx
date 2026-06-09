'use client'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800">
        <span className="text-purple-400 font-bold text-lg">⚡ DevFlow</span>
        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
          Nouveau projet
        </button>
      </nav>
      <main className="p-6">
        <p>Chargement...</p>
      </main>
    </div>
  )
}
