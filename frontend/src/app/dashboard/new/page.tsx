'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Project } from '@/types/project'

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewProjectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/projects', data).then(res => res.data.data as Project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      router.push('/dashboard')
    },
    onError: () => {
      setApiError('Impossible de créer le projet. Réessayez.')
    },
  })

  const onSubmit = (data: FormData) => {
    setApiError(null)
    mutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-white text-xl font-bold mb-6">Nouveau projet</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          <div>
            <label className="text-gray-400 text-sm block mb-1">Nom</label>
            <input
              {...register('name')}
              placeholder="Mon projet"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">Description (optionnel)</label>
            <textarea
              {...register('description')}
              placeholder="À quoi sert ce projet ?"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {apiError && (
            <p className="text-red-400 text-sm">{apiError}</p>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <Link
              href="/dashboard"
              className="border border-gray-700 hover:border-gray-500 text-gray-400 px-4 py-2 rounded-lg text-sm"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
            >
              {mutation.isPending ? 'Création...' : 'Créer'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
