import {Hono} from 'hono'
import {serve} from '@hono/node-server'

const app = new Hono()

app.get("/", ((c) => {
    return c.json({status: "ok"})
}))

serve({
    fetch: app.fetch,
    port: Number(process.env.PORT)
}, (info) => {
    console.log(`Serveur démarré sur http://localhost:${info.port}`)
})