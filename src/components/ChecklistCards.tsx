import { useState } from 'react'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import { ChecklistTemplateSheet } from './ChecklistTemplateSheet'
import { toast } from './Toast'
import { getTemplate, useTemplate, setTemplate, type TemplateKind } from '../state/settings'
import {
  addPackItem,
  addTodo,
  applyPackingTemplate,
  applyTodoTemplate,
  removePackItem,
  removeTodo,
  replacePacking,
  replaceTodos,
  togglePackItem,
  toggleTodo,
  updateTodo,
} from '../state/store'
import { daysUntil, formatDate, todayIso } from '../lib/date'
import { clsx } from '../lib/util'
import { useT } from '../i18n'
import type { TodoItem, Trip } from '../types'

/* ------------------------------------------------ 共通のメニュー */

interface ListMenuProps {
  kind: TemplateKind
  title: string
  labels: string[]
  doneCount: number
  onApplyTemplate: (labels: string[]) => number
  onClearChecks: () => void
  onClose: () => void
}

function ListMenu({
  kind,
  title,
  labels,
  doneCount,
  onApplyTemplate,
  onClearChecks,
  onClose,
}: ListMenuProps) {
  const t = useT()
  const [template, setTemplateOpen] = useState(false)
  const items = useTemplate(kind)

  return (
    <>
      <Sheet title={title} onClose={onClose}>
        <div className="menu" style={{ padding: 0 }}>
          <button
            className="menu__item"
            disabled={items.length === 0}
            onClick={() => {
              const added = onApplyTemplate(getTemplate(kind))
              onClose()
              toast(
                added > 0 ? t('list.added', { n: added }) : t('list.nothingAdded'),
                added > 0 ? 'success' : 'info',
              )
            }}
          >
            <span className="menu__icon">
              <Icon name="download" size={18} />
            </span>
            <span>
              {t('list.loadTemplate')}
              <small>{t('list.loadTemplateSub', { n: items.length })}</small>
            </span>
          </button>
          <button
            className="menu__item"
            disabled={labels.length === 0}
            onClick={() => {
              setTemplate(kind, labels)
              onClose()
              toast(t('list.savedTemplate'))
            }}
          >
            <span className="menu__icon">
              <Icon name="upload" size={18} />
            </span>
            <span>
              {t('list.saveTemplate')}
              <small>{t('list.saveTemplateSub')}</small>
            </span>
          </button>
          <button
            className="menu__item"
            onClick={() => {
              onClose()
              setTemplateOpen(true)
            }}
          >
            <span className="menu__icon">
              <Icon name="pencil" size={18} />
            </span>
            <span>
              {t('list.editTemplate')}
              <small>{t('list.editTemplateSub')}</small>
            </span>
          </button>
          <button
            className="menu__item"
            disabled={doneCount === 0}
            onClick={() => {
              onClearChecks()
              onClose()
              toast(t('list.cleared'))
            }}
          >
            <span className="menu__icon">
              <Icon name="check" size={18} />
            </span>
            <span>
              {t('list.clearChecks')}
              <small>{t('list.clearChecksSub')}</small>
            </span>
          </button>
        </div>
      </Sheet>

      {template ? (
        <ChecklistTemplateSheet kind={kind} fromTrip={labels} onClose={() => setTemplateOpen(false)} />
      ) : null}
    </>
  )
}

/* ------------------------------------------------ 旅までにやること */

type DueState = 'none' | 'done' | 'over' | 'soon' | 'later'

function dueState(item: TodoItem): DueState {
  if (!item.due) return 'none'
  if (item.done) return 'done'
  const left = daysUntil(item.due)
  if (left == null) return 'none'
  if (left < 0) return 'over'
  if (left <= 3) return 'soon'
  return 'later'
}

function TodoSheet({ trip, item, onClose }: { trip: Trip; item: TodoItem; onClose: () => void }) {
  const t = useT()
  const [label, setLabel] = useState(item.label)
  const [due, setDue] = useState(item.due)

  return (
    <Sheet
      title={t('todo.edit')}
      onClose={onClose}
      headerRight={
        <button
          className="iconbtn iconbtn--plain iconbtn--danger"
          onClick={() => {
            removeTodo(trip.id, item.id)
            toast(t('todo.deleted'))
            onClose()
          }}
          aria-label={t('tpl.removeAria')}
        >
          <Icon name="trash" size={18} />
        </button>
      }
      footer={
        <>
          <button className="btn btn--soft" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              updateTodo(trip.id, { ...item, label: label.trim() || item.label, due })
              onClose()
            }}
          >
            <Icon name="check" size={17} strokeWidth={2.4} />
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="field">
        <label className="field__label" htmlFor="todo-label">
          <Icon name="check" size={14} /> {t('todo.field.label')}
        </label>
        <input
          id="todo-label"
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="todo-due">
          <Icon name="calendar" size={14} /> {t('todo.field.due')}
        </label>
        <div className="row" style={{ gap: 8 }}>
          <input
            id="todo-due"
            className="input num"
            type="date"
            value={due}
            max={trip.startDate}
            onChange={(e) => setDue(e.target.value)}
          />
          {due ? (
            <button className="btn btn--soft btn--sm" onClick={() => setDue('')}>
              {t('todo.noDue')}
            </button>
          ) : null}
        </div>
        <p className="tiny muted" style={{ marginTop: 6 }}>
          {t('todo.departure', { date: formatDate(trip.startDate) })}
        </p>
      </div>
    </Sheet>
  )
}

export function TodoCard({ trip }: { trip: Trip }) {
  const t = useT()
  const [input, setInput] = useState('')
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState<TodoItem | null>(null)

  const done = trip.todos.filter((x) => x.done).length
  const rate = trip.todos.length ? Math.round((done / trip.todos.length) * 100) : 0
  const overdue = trip.todos.filter((x) => !x.done && x.due && x.due < todayIso()).length
  const left = daysUntil(trip.startDate)

  function dueLabel(item: TodoItem): string {
    const days = daysUntil(item.due)
    if (days == null) return ''
    const date = formatDate(item.due)
    if (item.done) return date
    if (days < 0) return t('todo.due.over', { date, n: -days })
    if (days === 0) return t('todo.due.today')
    if (days === 1) return t('todo.due.tomorrow')
    return t('todo.due.until', { date })
  }

  const showNote =
    trip.todos.length > 0 && (overdue > 0 || (left != null && left >= 0 && done < trip.todos.length))

  return (
    <section className="card pack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 className="section-title" style={{ fontSize: 15 }}>
          <Icon name="check" size={17} />
          {t('todo.title')}
        </h3>
        <div className="row" style={{ gap: 4 }}>
          <span className="tiny muted num">
            {done} / {trip.todos.length}
          </span>
          <button
            className="iconbtn iconbtn--plain"
            style={{ width: 32, height: 32 }}
            onClick={() => setMenu(true)}
            aria-label={t('todo.menuAria')}
          >
            <Icon name="dots" size={17} />
          </button>
        </div>
      </div>

      <div className="pack__bar pack__bar--todo">
        <i style={{ width: `${rate}%` }} />
      </div>

      {showNote ? (
        <p className={clsx('todo__note', overdue > 0 && 'is-warn')}>
          {overdue > 0
            ? t('todo.overdue', { n: overdue })
            : left === 0
              ? t('todo.leftToday')
              : t('todo.left', { n: left ?? 0, m: trip.todos.length - done })}
        </p>
      ) : null}

      {trip.todos.length === 0 ? (
        <p className="tiny muted" style={{ padding: '6px 0 2px' }}>
          {t('todo.empty')}
        </p>
      ) : null}

      {trip.todos.map((item) => (
        <div className="pack__item" key={item.id}>
          <button
            className={clsx('pack__check', item.done && 'is-on')}
            onClick={() => toggleTodo(trip.id, item.id)}
            aria-label={item.done ? t('pack.checkOff') : t('pack.checkOn')}
          >
            <Icon name="check" size={14} strokeWidth={3} />
          </button>
          <button className="todo__text" onClick={() => setEditing(item)}>
            <span className={clsx('pack__label', item.done && 'is-done')}>{item.label}</span>
            {item.due ? (
              <span className={clsx('todo__due', `todo__due--${dueState(item)}`)}>
                <Icon name="calendar" size={11} strokeWidth={2.4} />
                {dueLabel(item)}
              </span>
            ) : null}
          </button>
          <button
            className="iconbtn iconbtn--plain iconbtn--danger"
            style={{ width: 30, height: 30 }}
            onClick={() => removeTodo(trip.id, item.id)}
            aria-label={t('common.delete')}
          >
            <Icon name="close" size={14} strokeWidth={2.2} />
          </button>
        </div>
      ))}

      <form
        className="row"
        style={{ gap: 8, padding: '12px 0 8px' }}
        onSubmit={(e) => {
          e.preventDefault()
          addTodo(trip.id, input)
          setInput('')
        }}
      >
        <input
          className="input"
          style={{ padding: '9px 12px', fontSize: 14 }}
          value={input}
          placeholder={t('todo.addPh')}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn--soft btn--sm" type="submit" disabled={!input.trim()}>
          <Icon name="plus" size={15} strokeWidth={2.6} />
          {t('common.add')}
        </button>
      </form>

      {menu ? (
        <ListMenu
          kind="todo"
          title={t('todo.title')}
          labels={trip.todos.map((x) => x.label)}
          doneCount={done}
          onApplyTemplate={(labels) => applyTodoTemplate(trip.id, labels)}
          onClearChecks={() =>
            replaceTodos(
              trip.id,
              trip.todos.map((x) => ({ ...x, done: false })),
            )
          }
          onClose={() => setMenu(false)}
        />
      ) : null}

      {editing ? <TodoSheet trip={trip} item={editing} onClose={() => setEditing(null)} /> : null}
    </section>
  )
}

/* ------------------------------------------------ 持ち物リスト */

export function PackingCard({ trip }: { trip: Trip }) {
  const t = useT()
  const [input, setInput] = useState('')
  const [menu, setMenu] = useState(false)
  const done = trip.packing.filter((p) => p.done).length
  const rate = trip.packing.length ? Math.round((done / trip.packing.length) * 100) : 0

  return (
    <section className="card pack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 className="section-title" style={{ fontSize: 15 }}>
          <Icon name="suitcase" size={17} />
          {t('pack.title')}
        </h3>
        <div className="row" style={{ gap: 4 }}>
          <span className="tiny muted num">
            {done} / {trip.packing.length}
          </span>
          <button
            className="iconbtn iconbtn--plain"
            style={{ width: 32, height: 32 }}
            onClick={() => setMenu(true)}
            aria-label={t('pack.menuAria')}
          >
            <Icon name="dots" size={17} />
          </button>
        </div>
      </div>

      <div className="pack__bar">
        <i style={{ width: `${rate}%` }} />
      </div>

      {trip.packing.map((item) => (
        <div className="pack__item" key={item.id}>
          <button
            className={clsx('pack__check', item.done && 'is-on')}
            onClick={() => togglePackItem(trip.id, item.id)}
            aria-label={item.done ? t('pack.checkOff') : t('pack.checkOn')}
          >
            <Icon name="check" size={14} strokeWidth={3} />
          </button>
          <span className={clsx('pack__label', item.done && 'is-done')}>{item.label}</span>
          <button
            className="iconbtn iconbtn--plain iconbtn--danger"
            style={{ width: 30, height: 30 }}
            onClick={() => removePackItem(trip.id, item.id)}
            aria-label={t('common.delete')}
          >
            <Icon name="close" size={14} strokeWidth={2.2} />
          </button>
        </div>
      ))}

      <form
        className="row"
        style={{ gap: 8, padding: '12px 0 8px' }}
        onSubmit={(e) => {
          e.preventDefault()
          addPackItem(trip.id, input)
          setInput('')
        }}
      >
        <input
          className="input"
          style={{ padding: '9px 12px', fontSize: 14 }}
          value={input}
          placeholder={t('pack.addPh')}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn--soft btn--sm" type="submit" disabled={!input.trim()}>
          <Icon name="plus" size={15} strokeWidth={2.6} />
          {t('common.add')}
        </button>
      </form>

      {menu ? (
        <ListMenu
          kind="packing"
          title={t('pack.title')}
          labels={trip.packing.map((p) => p.label)}
          doneCount={done}
          onApplyTemplate={(labels) => applyPackingTemplate(trip.id, labels)}
          onClearChecks={() =>
            replacePacking(
              trip.id,
              trip.packing.map((p) => ({ ...p, done: false })),
            )
          }
          onClose={() => setMenu(false)}
        />
      ) : null}
    </section>
  )
}
