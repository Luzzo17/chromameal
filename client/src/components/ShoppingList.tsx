import { useState } from 'react'
import type { FormEvent } from 'react'
import './ShoppingList.css'

type ShoppingListProps = { ingredients: string[] }
type SavedList = {
    edits: Record<string, string>
    bought: Record<string, boolean>
    added: { id: string; text: string }[]
}
const storageKey = 'chromameal-shopping-v1'

function readList(): SavedList {
    try {
        const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
        if (value && typeof value.edits === 'object' && value.edits !== null
            && typeof value.bought === 'object' && value.bought !== null
            && Array.isArray(value.added)
            && value.added.every((item: { id?: unknown; text?: unknown } | null) =>
                item && typeof item.id === 'string' && typeof item.text === 'string')) {
            return value as SavedList
        }
    } catch { /* Start a fresh list if browser storage is unavailable. */ }
    return { edits: {}, bought: {}, added: [] }
}

function ItemText({ text }: { text: string }) {
    const match = text.match(/^(.*?)\s+(\d.*)$/)
    return match ? <>{match[1]} <strong>{match[2]}</strong></> : <>{text}</>
}

export default function ShoppingList({ ingredients }: ShoppingListProps) {
    const [saved, setSaved] = useState<SavedList>(readList)
    const [editing, setEditing] = useState<string | null>(null)
    const [draft, setDraft] = useState('')
    const [newItem, setNewItem] = useState('')
    const [storageError, setStorageError] = useState(false)
    const items = [...new Set(ingredients.filter((text) => text.trim()))].map((text) => ({
        id: `meal:${text}`, text,
    })).concat(saved.added)

    function save(next: SavedList) {
        setSaved(next)
        try {
            localStorage.setItem(storageKey, JSON.stringify(next))
            setStorageError(false)
        } catch { setStorageError(true) }
    }

    function finishEdit(event: FormEvent, id: string) {
        event.preventDefault()
        if (!draft.trim()) return
        save({ ...saved, edits: { ...saved.edits, [id]: draft.trim() } })
        setEditing(null)
    }

    function addItem(event: FormEvent) {
        event.preventDefault()
        if (!newItem.trim()) return
        save({ ...saved, added: [...saved.added, { id: `manual:${crypto.randomUUID()}`, text: newItem.trim() }] })
        setNewItem('')
    }

    function deleteItem(id: string) {
        const edits = { ...saved.edits }
        const bought = { ...saved.bought }
        delete edits[id]
        delete bought[id]
        save({ edits, bought, added: saved.added.filter((item) => item.id !== id) })
        if (editing === id) {
            setEditing(null)
            setDraft('')
        }
    }

    return (
        <section className="shopping" aria-labelledby="shopping-title">
            <header className="section-header shadow">
                <h2 id="shopping-title">La tua spesa</h2>
            </header>
            <div className="shopping-paper">
                <ul className="shopping-items">
                    {items.map(({ id, text }) => {
                        const label = typeof saved.edits[id] === 'string' ? saved.edits[id] : text
                        return (
                            <li className="shopping-row" key={id}>
                                <input type="checkbox" checked={Boolean(saved.bought[id])}
                                    aria-label={`Comprato: ${label}`}
                                    onChange={(event) => save({ ...saved, bought: { ...saved.bought, [id]: event.target.checked } })} />
                                {editing === id ? (
                                    <form className="shopping-edit" onSubmit={(event) => finishEdit(event, id)}>
                                        <input autoFocus aria-label="Modifica articolo" value={draft}
                                            onChange={(event) => setDraft(event.target.value)}
                                            onKeyDown={(event) => { if (event.key === 'Escape') setEditing(null) }} />
                                        <button type="submit">Salva</button>
                                        <button type="button" onClick={() => setEditing(null)}>Annulla</button>
                                    </form>
                                ) : (
                                    <button type="button" className={`shopping-label${saved.bought[id] ? ' shopping-label--bought' : ''}`}
                                        aria-label={`Modifica: ${label}`} onClick={() => { setEditing(id); setDraft(label) }}>
                                        <ItemText text={label} />
                                    </button>
                                )}
                                {id.startsWith('manual:') && (
                                    <button type="button" className="shopping-delete"
                                        aria-label={`Elimina: ${label}`} onClick={() => deleteItem(id)}>
                                        Elimina
                                    </button>
                                )}
                            </li>
                        )
                    })}
                </ul>
                <form className="shopping-add" onSubmit={addItem}>
                    <input aria-label="Nuovo articolo" placeholder="Aggiungi un articolo…" value={newItem}
                        onChange={(event) => setNewItem(event.target.value)} />
                    <button type="submit" disabled={!newItem.trim()}>Aggiungi</button>
                </form>
                {storageError && <p role="status">Le modifiche restano disponibili solo finché questa pagina è aperta.</p>}
            </div>
        </section>
    )
}
