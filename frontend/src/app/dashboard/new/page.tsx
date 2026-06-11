'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'

// TODO 1 : définissez le schéma Zod avec :
//  - name : string requis, min 1 caractère, message "Le nom est requis"
//  - description : string optionnel
const schema = z.object({
  // ...
})

type FormData = z.infer<typeof schema>

export default function NewProjectPage() {

  // TODO 2 : appelez useForm<FormData>() avec le zodResolver
  // et récupérez : register, handleSubmit, formState: { errors }

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-white text-xl font-bold mb-6">Nouveau projet</h1>

        {/* TODO 3 : branchez handleSubmit(onSubmit) sur le onSubmit du form */}
        <form className="flex flex-col gap-4">

          <div>
            <label className="text-gray-400 text-sm block mb-1">Nom</label>
            {/* TODO 4a : branchez register('name') sur cet input */}
            <input
              placeholder="Mon projet"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {/* TODO 4b : affichez errors.name?.message ici, en rouge (voir page login pour le style) */}
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">Description (optionnel)</label>
            {/* TODO 4c : branchez register('description') sur ce textarea */}
            <textarea
              placeholder="À quoi sert ce projet ?"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Link
              href="/dashboard"
              className="border border-gray-700 hover:border-gray-500 text-gray-400 px-4 py-2 rounded-lg text-sm"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
            >
              Créer
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
