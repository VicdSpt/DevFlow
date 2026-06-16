const BASE_URL = 'http://localhost:3000'

const users = [
  { name: 'Alice Membre', email: 'alice@test.com', password: 'password123' },
  { name: 'Bob Viewer', email: 'bob@test.com', password: 'password123' },
]

async function main() {
  for (const user of users) {
    const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3001' },
      body: JSON.stringify(user),
    })
    if (res.ok) {
      console.log(`✓ Créé : ${user.email}`)
    } else {
      const data = await res.json()
      console.log(`✗ ${user.email} : ${JSON.stringify(data)}`)
    }
  }
}

main()
