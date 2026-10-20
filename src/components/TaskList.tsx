import { AnimatePresence, Reorder } from 'framer-motion'
import type { Task, ViewId } from '../types'
import TaskCard, { type TaskHandlers } from './TaskCard'
import { IconCheckCircle, IconClock, IconInbox, IconPin, IconSearch } from './Icons'

interface TaskListProps {
  open: Task[]
  done: Task[]
  view: ViewId
  listKey: string
  query: string
  hasTagFilter: boolean
  doneLabel: string
  doneNote: string | null
  now: number
  focusId: string | null
  handlers: TaskHandlers
  onReorder: (next: Task[]) => void
}

const EMPTY: Record<ViewId, { title: string; sub: string }> = {
  today: { title: '今天没有到期的事', sub: '去看看「全部」，或者写下明天要做的事' },
  all: { title: '待办清空了', sub: '在上面的输入框写一句，Enter 就存下' },
  done: { title: '还没有完成的任务', sub: '勾掉一件，它就会出现在这里' },
  pinned: { title: '还没有置顶的任务', sub: '悬停一条任务，点图钉就能置顶' },
}

function EmptyState({
  view,
  query,
  hasTagFilter,
}: {
  view: ViewId
  query: string
  hasTagFilter: boolean
}) {
  if (query.trim()) {
    return (
      <div className="empty">
        <div className="empty-art">
          <IconSearch size={24} />
        </div>
        <p className="empty-title">没有找到「{query.trim()}」</p>
        <p className="empty-sub">换个关键词试试，或者按 Esc 清空搜索</p>
      </div>
    )
  }

  if (hasTagFilter) {
    return (
      <div className="empty">
        <div className="empty-art">
          <IconInbox size={24} />
        </div>
        <p className="empty-title">这些标签下还没有任务</p>
        <p className="empty-sub">换个标签，或者点侧栏的「清除」看全部</p>
      </div>
    )
  }

  const text = EMPTY[view]
  const Art = view === 'done' ? IconCheckCircle : view === 'pinned' ? IconPin : IconInbox

  return (
    <div className="empty">
      <div className="empty-art">
        <Art size={24} />
      </div>
      <p className="empty-title">{text.title}</p>
      <p className="empty-sub">{text.sub}</p>
    </div>
  )
}

export default function TaskList({
  open,
  done,
  view,
  listKey,
  query,
  hasTagFilter,
  doneLabel,
  doneNote,
  now,
  focusId,
  handlers,
  onReorder,
}: TaskListProps) {
  const pinned = view === 'pinned' ? [] : open.filter((t) => t.pinned)
  const rest = view === 'pinned' ? open : open.filter((t) => !t.pinned)
  const isEmpty = open.length === 0 && done.length === 0

  const card = (task: Task, i: number) => (
    <TaskCard
      key={task.id}
      task={task}
      index={i}
      now={now}
      handlers={handlers}
      focused={focusId === task.id}
    />
  )

  return (
    <div className="list-wrap">
      <div className="list-inner" key={listKey}>
        {isEmpty ? (
          <EmptyState view={view} query={query} hasTagFilter={hasTagFilter} />
        ) : (
          <>
            {pinned.length > 0 && (
              <section className="tgroup">
                <div className="tgroup-head">
                  <IconPin size={13} />
                  <span>置顶</span>
                  <i className="tgroup-line" />
                </div>
                <Reorder.Group
                  as="ul"
                  axis="y"
                  values={pinned}
                  onReorder={onReorder}
                  className="task-list"
                >
                  <AnimatePresence initial={false}>{pinned.map(card)}</AnimatePresence>
                </Reorder.Group>
              </section>
            )}

            {rest.length > 0 && (
              <section className="tgroup">
                {pinned.length > 0 && (
                  <div className="tgroup-head is-plain">
                    <span>其他</span>
                    <i className="tgroup-line" />
                  </div>
                )}
                <Reorder.Group as="ul" axis="y" values={rest} onReorder={onReorder} className="task-list">
                  <AnimatePresence initial={false}>
                    {rest.map((task, i) => card(task, i + pinned.length))}
                  </AnimatePresence>
                </Reorder.Group>
              </section>
            )}

            {done.length > 0 && (
              <section className="tgroup is-done">
                <div className="tgroup-head is-plain">
                  <IconClock size={13} />
                  <span>{doneLabel}</span>
                  <i className="tgroup-line" />
                  {doneNote && <span className="tgroup-hint">{doneNote}</span>}
                </div>
                <Reorder.Group
                  as="ul"
                  axis="y"
                  values={done}
                  onReorder={() => undefined}
                  className="task-list"
                  dragListener={false}
                >
                  <AnimatePresence initial={false}>
                    {done.map((task, i) => card(task, Math.min(open.length + i, 8)))}
                  </AnimatePresence>
                </Reorder.Group>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
