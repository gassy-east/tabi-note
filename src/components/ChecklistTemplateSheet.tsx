import { useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { toast } from './Toast'
import { factoryTemplate, getTemplate, setTemplate, type TemplateKind } from '../state/settings'
import { moveItem, uid } from '../lib/util'
import { useT } from '../i18n'

interface Row {
  id: string
  label: string
}

interface ChecklistTemplateSheetProps {
  kind: TemplateKind
  onClose: () => void
  /** 「この旅の◯◯から作る」で使う候補 */
  fromTrip?: string[]
}

export function ChecklistTemplateSheet({ kind, onClose, fromTrip }: ChecklistTemplateSheetProps) {
  const t = useT()
  const [rows, setRows] = useState<Row[]>(() =>
    getTemplate(kind).map((label) => ({ id: uid('tp_'), label })),
  )
  const [input, setInput] = useState('')

  const copy =
    kind === 'packing'
      ? {
          title: t('tpl.packing.title'),
          lead: t('tpl.packing.lead'),
          placeholder: t('tpl.packing.addPh'),
          from: t('tpl.packing.fromTrip'),
        }
      : {
          title: t('tpl.todo.title'),
          lead: t('tpl.todo.lead'),
          placeholder: t('tpl.todo.addPh'),
          from: t('tpl.todo.fromTrip'),
        }

  const filled = rows.filter((r) => r.label.trim())

  function add(label: string) {
    const trimmed = label.trim()
    if (!trimmed) return
    setRows((r) => [...r, { id: uid('tp_'), label: trimmed }])
    setInput('')
  }

  function move(index: number, delta: number) {
    const to = index + delta
    if (to < 0 || to >= rows.length) return
    setRows((r) => moveItem(r, index, to))
  }

  return (
    <Sheet
      title={copy.title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--soft" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              setTemplate(
                kind,
                rows.map((r) => r.label),
              )
              toast(t('tpl.saved'))
              onClose()
            }}
          >
            <Icon name="check" size={17} strokeWidth={2.4} />
            {t('common.save')}
          </button>
        </>
      }
    >
      <p className="tiny muted" style={{ marginBottom: 14 }}>
        {copy.lead}
      </p>

      <ul className="tpl">
        {rows.map((row, i) => (
          <li className="tpl__row" key={row.id}>
            <div className="tpl__move">
              <button
                className="tpl__arrow tpl__arrow--up"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={t('tpl.up')}
              >
                <Icon name="down" size={13} strokeWidth={2.6} />
              </button>
              <button
                className="tpl__arrow"
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label={t('tpl.down')}
              >
                <Icon name="down" size={13} strokeWidth={2.6} />
              </button>
            </div>
            <input
              className="input tpl__input"
              value={row.label}
              placeholder={t('tpl.itemPh')}
              onChange={(e) =>
                setRows((r) => r.map((x) => (x.id === row.id ? { ...x, label: e.target.value } : x)))
              }
            />
            <button
              className="iconbtn iconbtn--plain iconbtn--danger"
              style={{ width: 34, height: 34 }}
              onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
              aria-label={t('tpl.removeAria')}
            >
              <Icon name="close" size={15} strokeWidth={2.2} />
            </button>
          </li>
        ))}
      </ul>

      <form
        className="row"
        style={{ gap: 8, marginTop: 12 }}
        onSubmit={(e) => {
          e.preventDefault()
          add(input)
        }}
      >
        <input
          className="input"
          style={{ padding: '9px 12px', fontSize: 14 }}
          value={input}
          placeholder={copy.placeholder}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn--soft btn--sm" type="submit" disabled={!input.trim()}>
          <Icon name="plus" size={15} strokeWidth={2.6} />
          {t('common.add')}
        </button>
      </form>

      <div className="divider-dash" style={{ margin: '18px 0 12px' }} />

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', paddingBottom: 8 }}>
        <button
          className="btn btn--soft btn--sm"
          onClick={() => setRows(factoryTemplate(kind).map((label) => ({ id: uid('tp_'), label })))}
        >
          <Icon name="sparkle" size={15} />
          {t('tpl.reset')}
        </button>
        {fromTrip && fromTrip.length > 0 ? (
          <button
            className="btn btn--soft btn--sm"
            onClick={() => setRows(fromTrip.map((label) => ({ id: uid('tp_'), label })))}
          >
            <Icon name={kind === 'packing' ? 'suitcase' : 'check'} size={15} />
            {copy.from}
          </button>
        ) : null}
        <span className="tiny muted" style={{ marginLeft: 'auto' }}>
          {t('common.items', { n: filled.length })}
        </span>
      </div>
    </Sheet>
  )
}
