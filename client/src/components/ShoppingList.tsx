import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../lib/api'
import { addShoppingItem, deleteShoppingItem, getShoppingItems, updateShoppingItem } from '../lib/shopping'
import type { ShoppingItem } from '../lib/shopping'
import Section from './Section'
import ShoppingIcon from './icons/ShoppingIcon'
import './ShoppingList.css'

export default function ShoppingList() {
    const [items, setItems] = useState<ShoppingItem[] | null>(null)
    const [editing, setEditing] = useState<number | null>(null)
    const [draft, setDraft] = useState('')
    const [draftQuantity, setDraftQuantity] = useState('')
    const [newItem, setNewItem] = useState('')
    const [newQuantity, setNewQuantity] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [needsLogin, setNeedsLogin] = useState(false)
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let active = true
        getShoppingItems()
            .then(response => {
                if (active) { setItems(response.data); setError(''); setNeedsLogin(false) }
            })
            .catch(reason => {
                if (!active) return
                const unauthorized = reason instanceof ApiError && reason.status === 401
                setNeedsLogin(unauthorized)
                if (unauthorized) setItems(null)
                setError(unauthorized ? 'Accedi per usare la tua lista della spesa.' : 'Impossibile caricare la lista della spesa. Riprova.')
            })
        return () => { active = false }
    }, [attempt])

    async function perform(action: () => Promise<void>) {
        if (busy) return
        setBusy(true)
        setError('')
        setMessage('')
        try { await action() }
        catch (reason) {
            if (reason instanceof ApiError && (reason.status === 401 || reason.status === 419)) {
                setNeedsLogin(true)
                setItems(null)
                setEditing(null)
                setError('La sessione è scaduta. Accedi di nuovo per continuare.')
            } else if (reason instanceof ApiError && reason.status === 422) {
                setError(Object.values(reason.errors).flat().join(' ') || reason.message)
            } else {
                setError('Operazione non riuscita. Ricarica la lista per verificarne lo stato prima di riprovare.')
            }
        } finally { setBusy(false) }
    }

    function addItem(event: FormEvent) {
        event.preventDefault()
        if (!newItem.trim()) return
        void perform(async () => {
            const response = await addShoppingItem(newItem.trim(), newQuantity)
            setItems(previous => [...(previous ?? []), response.data])
            setNewItem('')
            setNewQuantity('')
            setMessage('Articolo aggiunto e salvato nel tuo account.')
        })
    }

    function finishEdit(event: FormEvent, id: number) {
        event.preventDefault()
        if (!draft.trim()) return
        void perform(async () => {
            const response = await updateShoppingItem(id, { name: draft.trim(), quantity: draftQuantity.trim() || null })
            setItems(previous => previous?.map(item => item.id === id ? response.data : item) ?? [])
            setEditing(null)
            setMessage('Articolo aggiornato.')
        })
    }

    function toggle(item: ShoppingItem) {
        void perform(async () => {
            const response = await updateShoppingItem(item.id, { is_purchased: !item.is_purchased })
            setItems(previous => previous?.map(value => value.id === item.id ? response.data : value) ?? [])
            setMessage(response.data.is_purchased ? 'Articolo segnato come acquistato.' : 'Articolo segnato come da acquistare.')
        })
    }

    function remove(id: number) {
        void perform(async () => {
            await deleteShoppingItem(id)
            setItems(previous => previous?.filter(item => item.id !== id) ?? [])
            if (editing === id) setEditing(null)
            setMessage('Articolo eliminato.')
        })
    }

    return (
        <Section
            title="La tua spesa"
            icon={<ShoppingIcon />}
            className="shopping"
            contentClassName="shopping-paper"
            aria-label="La tua spesa"
            aria-busy={busy}
        >
                {error && <div className="shopping-feedback">
                    <p className="form-error" role="alert">{error}</p>
                    {needsLogin ? <Link to="/account">Vai al tuo account</Link> : (
                        <button className="action-button bg-secondary" type="button" disabled={busy} onClick={() => setAttempt(value => value + 1)}>Ricarica la lista</button>
                    )}
                </div>}
                {items === null && !error && <p className="shopping-feedback" role="status">Caricamento lista…</p>}
                {message && <p className="shopping-feedback" role="status">{message}</p>}
                {items !== null && !needsLogin && <>
                    {items.length === 0 && <p className="shopping-feedback">La tua lista è vuota. Aggiungi il primo articolo.</p>}
                    <ul className="shopping-items">
                        {items.map(item => (
                            <li className="shopping-row" key={item.id}>
                                <input type="checkbox" checked={item.is_purchased} disabled={busy}
                                    aria-label={`Comprato: ${item.name}`} onChange={() => toggle(item)} />
                                {editing === item.id ? (
                                    <form className="shopping-edit" onSubmit={event => finishEdit(event, item.id)}>
                                        <input autoFocus aria-label="Modifica articolo" value={draft} required maxLength={255} disabled={busy}
                                            onChange={event => setDraft(event.target.value)}
                                            onKeyDown={event => { if (event.key === 'Escape' && !busy) setEditing(null) }} />
                                        <input aria-label="Modifica quantità" placeholder="Quantità (facoltativa)" value={draftQuantity} maxLength={255} disabled={busy} onChange={event => setDraftQuantity(event.target.value)} />
                                        <button className="action-button bg-secondary" type="submit" disabled={busy || !draft.trim()}>Salva</button>
                                        <button className="action-button bg-secondary" type="button" disabled={busy} onClick={() => setEditing(null)}>Annulla</button>
                                    </form>
                                ) : (
                                    <button type="button" disabled={busy} className={`shopping-label${item.is_purchased ? ' shopping-label--bought' : ''}`}
                                        aria-label={`Modifica: ${item.name}`} onClick={() => { setEditing(item.id); setDraft(item.name); setDraftQuantity(item.quantity ?? '') }}>
                                        {item.name}{item.quantity && <> <strong>{item.quantity}</strong></>}
                                    </button>
                                )}
                                <button type="button" disabled={busy} className="shopping-delete action-button bg-secondary"
                                    aria-label={`Elimina: ${item.name}`} onClick={() => remove(item.id)}>Elimina</button>
                            </li>
                        ))}
                    </ul>
                    <form className="shopping-add" onSubmit={addItem}>
                        <input aria-label="Nuovo articolo" placeholder="Aggiungi un articolo…" value={newItem} required maxLength={255} disabled={busy} onChange={event => setNewItem(event.target.value)} />
                        <input aria-label="Quantità del nuovo articolo" placeholder="Quantità (es. 2 confezioni)" value={newQuantity} maxLength={255} disabled={busy} onChange={event => setNewQuantity(event.target.value)} />
                        <button className="action-button bg-secondary" type="submit" disabled={busy || !newItem.trim()}>Aggiungi</button>
                    </form>
                </>}
        </Section>
    )
}
