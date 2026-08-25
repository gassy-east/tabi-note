import { useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { toast } from './Toast'
import { factoryTemplate, getTemplate, setTemplate, type TemplateKind } from '../state/settings'
import { moveItem, uid } from '../lib/util'

interface Row {
  id: string
  label: string
}

const COPY: Record<TemplateKind, { title: string; lead: string; placeholder: string; from: string }> =
  {
    packing: {
      title: '持ち物テンプレート',
      lead: '新しい旅をつくるとき、ここに並べた項目が持ち物リストの初期値になります。いつも持っていくものを、自分用に整えておいてください。',
      placeholder: '項目を追加（例：延長コード）',
      from: 'この旅の持ち物から作る',
    },
    todo: {
      title: 'やることテンプレート',
      lead: '新しい旅をつくるとき、ここに並べた項目が「旅までにやること」の初期値になります。毎回やる準備を書いておくと、抜けがなくなります。',
      placeholder: '項目を追加（例：レンタカーを予約する）',
      from: 'この旅のやることから作る',
    },
  }

interface ChecklistTemplateSheetProps {
  kind: TemplateKind
  onClose: () => void
  /** 「この旅の◯◯から作る」で使う候補 */
  fromTrip?: string[]
}

export function ChecklistTemplateSheet({ kind, onClose, fromTrip }: ChecklistTemplateSheetProps) {
  const copy = COPY[kind]
  const [rows, setRows] = useState<Row[]>(() =>
    getTemplate(kind).map((label) => ({ id: uid('tp_'), label })),
  )
  const [input, setInput] = useState('')

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
            キャンセル
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              setTemplate(
                kind,
                rows.map((r) => r.label),
              )
              toast('テンプレートを保存しました')
              onClose()
            }}
          >
            <Icon name="check" size={17} strokeWidth={2.4} />
            保存する
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
                aria-label="ひとつ上へ"
              >
                <Icon name="down" size={13} strokeWidth={2.6} />
              </button>
              <button
                className="tpl__arrow"
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label="ひとつ下へ"
              >
                <Icon name="down" size={13} strokeWidth={2.6} />
              </button>
            </div>
            <input
              className="input tpl__input"
              value={row.label}
              placeholder="項目名"
              onChange={(e) =>
                setRows((r) => r.map((x) => (x.id === row.id ? { ...x, label: e.target.value } : x)))
              }
            />
            <button
              className="iconbtn iconbtn--plain iconbtn--danger"
              style={{ width: 34, height: 34 }}
              onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
              aria-label="この項目を削除"
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
          追加
        </button>
      </form>

      <div className="divider-dash" style={{ margin: '18px 0 12px' }} />

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', paddingBottom: 8 }}>
        <button
          className="btn btn--soft btn--sm"
          onClick={() => setRows(factoryTemplate(kind).map((label) => ({ id: uid('tp_'), label })))}
        >
          <Icon name="sparkle" size={15} />
          はじめの内容にもどす
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
          {filled.length} 項目
        </span>
      </div>
    </Sheet>
  )
}
